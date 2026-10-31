from flask import Blueprint, request, g
from app.extensions import db
from app.models.order import Order
from app.models.cart import Address, Cart, CartItem
from app.schemas.misc_schemas import OrderCreateSchema, AddressSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import jwt_required_custom, optional_jwt
from app.services.order_service import create_order, OrderError

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@orders_bp.post("")
@optional_jwt
def place_order():
    """Creates an order. Works for both guest checkout and authenticated
    customers - user is attached automatically when a valid token is present,
    but is never required."""
    data, errors = validate_payload(OrderCreateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    user = g.get("current_user")
    try:
        order = create_order(data, user=user)
    except OrderError as e:
        return error(e.message, status_code=e.status_code)

    # Optionally persist/refresh the customer's default address
    if user and data.get("save_address"):
        existing = Address.query.filter_by(user_id=user.id, is_default=True).first()
        if not existing:
            existing = Address(user_id=user.id, is_default=True)
            db.session.add(existing)
        existing.full_name = data["customer_name"]
        existing.phone = data["customer_phone"]
        existing.address_line = data["address"]
        existing.city = data["city"]
        existing.postal_code = data.get("postal_code")
        db.session.commit()

    # Clear the authenticated user's server-side cart after a successful order
    if user:
        cart = Cart.query.filter_by(user_id=user.id).first()
        if cart:
            CartItem.query.filter_by(cart_id=cart.id).delete()
            db.session.commit()

    return success({"order": order.to_dict(detailed=True)}, "Order placed successfully", 201)


@orders_bp.get("")
@jwt_required_custom
def list_my_orders():
    page, limit = paginate_args(request)
    q = Order.query.filter_by(user_id=g.current_user.id).order_by(Order.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return success({
        "items": [o.to_dict() for o in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@orders_bp.get("/<string:order_number>")
@optional_jwt
def get_order(order_number):
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return error("Order not found.", status_code=404)

    # Authorization: owner or guest lookup only by exact order number (acts as a
    # shared secret for guest tracking); authenticated users can't view others' orders.
    if order.user_id and (not g.get("current_user") or g.current_user.id != order.user_id):
        return error("You do not have permission to view this order.", status_code=403)

    return success({"order": order.to_dict(detailed=True)})


@orders_bp.get("/address/default")
@jwt_required_custom
def get_default_address():
    """Used by checkout to autofill saved customer information."""
    address = Address.query.filter_by(user_id=g.current_user.id, is_default=True).first()
    return success({"address": address.to_dict() if address else None})


@orders_bp.post("/address")
@jwt_required_custom
def save_address():
    data, errors = validate_payload(AddressSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    address = Address.query.filter_by(user_id=g.current_user.id, is_default=True).first()
    if not address:
        address = Address(user_id=g.current_user.id)
        db.session.add(address)

    for field in ("full_name", "phone", "address_line", "city", "postal_code"):
        setattr(address, field, data.get(field))
    address.is_default = True
    db.session.commit()
    return success({"address": address.to_dict()}, "Address saved")
