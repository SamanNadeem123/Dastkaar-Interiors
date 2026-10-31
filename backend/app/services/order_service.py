import random
import string
import logging
from datetime import datetime, timezone
from flask import current_app
from sqlalchemy.orm import lazyload
from app.extensions import db
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatusHistory, Payment, ORDER_STATUSES
from app.models.misc import DeliveryZone, Setting
from app.services import email_service, notification_service

logger = logging.getLogger(__name__)


class OrderError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def generate_order_number():
    year = datetime.now(timezone.utc).year
    for _ in range(5):
        suffix = "".join(random.choices(string.digits, k=6))
        candidate = f"ORD-{year}-{suffix}"
        if not Order.query.filter_by(order_number=candidate).first():
            return candidate
    # extremely unlikely fallback
    return f"ORD-{year}-{uuid_fallback()}"


def uuid_fallback():
    import uuid
    return uuid.uuid4().hex[:8].upper()


def get_delivery_charge(city: str) -> float:
    if not city:
        return _default_delivery_charge()
    zone = DeliveryZone.query.filter(
        db.func.lower(DeliveryZone.city_name) == city.strip().lower(),
        DeliveryZone.is_active.is_(True),
    ).first()
    if zone:
        return float(zone.fee)
    return _default_delivery_charge()


def _default_delivery_charge():
    setting = Setting.query.filter_by(key="default_delivery_charge").first()
    if setting and setting.value:
        try:
            return float(setting.value)
        except ValueError:
            pass
    return float(current_app.config.get("DEFAULT_DELIVERY_CHARGE", 3000))


def create_order(payload: dict, user=None):
    """
    Creates an order inside a single DB transaction. The backend recomputes
    every price, discount, and total from the database - the frontend totals
    are display-only and never trusted.
    """
    idempotency_key = payload.get("idempotency_key")
    if idempotency_key:
        existing = Order.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            return existing  # duplicate submission (double-click/retry) -> return the original order

    items_payload = payload.get("items") or []
    if not items_payload:
        raise OrderError("Order must contain at least one item.")

    customer_name = (payload.get("customer_name") or "").strip()
    customer_phone = (payload.get("customer_phone") or "").strip()
    address = (payload.get("address") or "").strip()
    city = (payload.get("city") or "").strip()
    customer_email = (payload.get("customer_email") or "").strip() or None
    postal_code = payload.get("postal_code")
    payment_method = payload.get("payment_method", "cod")

    if not customer_name or not customer_phone or not address or not city:
        raise OrderError("Customer name, phone, address and city are required.")
    if payment_method not in ("cod", "card"):
        raise OrderError("Invalid payment method.")

    order_items = []
    subtotal = 0.0
    total_discount = 0.0

    try:
        for raw_item in items_payload:
            product_id = raw_item.get("product_id")
            quantity = int(raw_item.get("quantity", 1))
            selected_color = raw_item.get("selected_color")

            if quantity < 1:
                raise OrderError("Quantity must be at least 1.")

            # NOTE: images/colors are eager-joined ("lazy=joined") on Product by
            # default, but PostgreSQL cannot apply FOR UPDATE across an outer
            # join. We explicitly lazy-load those relationships for this
            # locking query only, then access them normally afterwards
            # (they're fetched on first access, still within the same transaction).
            product = (
                Product.query
                .options(lazyload(Product.images), lazyload(Product.colors))
                .filter_by(id=product_id, is_active=True)
                .with_for_update()
                .first()
            )
            if not product:
                raise OrderError(f"Product {product_id} is not available.")

            if product.availability == "out_of_stock":
                raise OrderError(f"'{product.name}' is out of stock.")

            if product.availability == "in_stock" and product.stock_quantity < quantity:
                raise OrderError(f"Only {product.stock_quantity} unit(s) of '{product.name}' available.")

            if selected_color:
                valid_colors = {c.color_name for c in product.colors}
                if valid_colors and selected_color not in valid_colors:
                    raise OrderError(f"Selected color '{selected_color}' is not available for '{product.name}'.")

            unit_price = product.effective_price
            original_price = float(product.original_price)
            line_discount = round((original_price - unit_price) * quantity, 2)
            line_total = round(unit_price * quantity, 2)

            subtotal += original_price * quantity
            total_discount += line_discount

            order_items.append({
                "product": product,
                "quantity": quantity,
                "selected_color": selected_color,
                "unit_price": unit_price,
                "discount": line_discount,
                "line_total": line_total,
            })

        delivery_charge = get_delivery_charge(city)
        total = round((subtotal - total_discount) + delivery_charge, 2)

        order = Order(
            order_number=generate_order_number(),
            user_id=user.id if user else None,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            address=address,
            city=city,
            postal_code=postal_code,
            subtotal=round(subtotal, 2),
            discount=round(total_discount, 2),
            delivery_charge=delivery_charge,
            total=total,
            payment_method=payment_method,
            payment_status="pending",
            order_status="pending",
            idempotency_key=idempotency_key,
        )
        db.session.add(order)
        db.session.flush()  # get order.id

        for item in order_items:
            product = item["product"]
            oi = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name_snapshot=product.name,
                product_image_snapshot=next((i.image_url for i in product.images if i.is_primary), (product.images[0].image_url if product.images else None)),
                selected_color=item["selected_color"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                discount=item["discount"],
                line_total=item["line_total"],
            )
            db.session.add(oi)

            # Inventory update (made_to_order/coming_soon bypass stock limits)
            if product.availability == "in_stock":
                product.stock_quantity = max(0, product.stock_quantity - item["quantity"])
                if product.stock_quantity == 0:
                    product.availability = "out_of_stock"

        payment = Payment(
            order_id=order.id,
            provider="cod" if payment_method == "cod" else current_app.config.get("PAYMENT_PROVIDER", "sandbox"),
            amount=total,
            currency=current_app.config.get("CURRENCY", "PKR"),
            status="pending",
        )
        db.session.add(payment)

        history = OrderStatusHistory(order_id=order.id, old_status=None, new_status="pending", changed_by="system")
        db.session.add(history)

        db.session.commit()

    except OrderError:
        db.session.rollback()
        raise
    except Exception as e:
        db.session.rollback()
        logger.exception("Order creation failed unexpectedly: %s", e)
        raise OrderError("Failed to create order due to a server error. Please try again.", 500)

    # Post-commit side effects - failures here must never roll back the order
    try:
        notification_service.notify_admins_new_order(order)
    except Exception as e:
        logger.error("Admin notification failed: %s", e)

    try:
        email_service.send_order_confirmation(order)
        admin_email = current_app.config.get("ADMIN_EMAIL")
        if admin_email:
            email_service.send_admin_new_order_notification(order, admin_email)
    except Exception as e:
        logger.error("Order email failed: %s", e)

    return order


def update_order_status(order: Order, new_status: str, changed_by="admin"):
    if new_status not in ORDER_STATUSES:
        raise OrderError("Invalid order status.")

    old_status = order.order_status
    if old_status == new_status:
        return order  # avoid duplicate notifications

    if old_status in ("delivered", "cancelled"):
        raise OrderError(
            f"This order is already {old_status} and its status can no longer be changed.",
            status_code=400,
        )

    # Restock if cancelled
    if new_status == "cancelled" and old_status != "cancelled":
        for item in order.items:
            product = db.session.get(Product, item.product_id) if item.product_id else None
            if product and product.availability in ("in_stock", "out_of_stock"):
                product.stock_quantity += item.quantity
                if product.stock_quantity > 0:
                    product.availability = "in_stock"

    order.order_status = new_status
    db.session.add(OrderStatusHistory(order_id=order.id, old_status=old_status, new_status=new_status, changed_by=changed_by))
    db.session.commit()

    try:
        email_service.send_order_status_update(order)
    except Exception as e:
        logger.error("Status update email failed: %s", e)

    try:
        notification_service.notify_customer_status_update(order)
    except Exception as e:
        logger.error("Status update socket emit failed: %s", e)

    return order
