from flask import Blueprint, request, g
from app.extensions import db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.misc_schemas import CartItemAddSchema, CartItemUpdateSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.middleware.auth import jwt_required_custom

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _get_or_create_cart(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    return cart


def _validate_product_and_color(product_id, selected_color):
    product = Product.query.filter_by(id=product_id, is_active=True).first()
    if not product:
        return None, "Product not found or unavailable."
    if selected_color:
        valid_colors = {c.color_name for c in product.colors}
        if valid_colors and selected_color not in valid_colors:
            return None, f"Color '{selected_color}' is not available for this product."
    return product, None


@cart_bp.get("")
@jwt_required_custom
def get_cart():
    cart = _get_or_create_cart(g.current_user.id)
    return success({"cart": cart.to_dict()})


@cart_bp.post("/items")
@jwt_required_custom
def add_item():
    data, errors = validate_payload(CartItemAddSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    product, err = _validate_product_and_color(data["product_id"], data.get("selected_color"))
    if err:
        return error(err, status_code=400)
    if product.availability == "out_of_stock":
        return error("This product is currently out of stock.", status_code=400)

    cart = _get_or_create_cart(g.current_user.id)
    existing = CartItem.query.filter_by(
        cart_id=cart.id, product_id=product.id, selected_color=data.get("selected_color")
    ).first()

    if existing:
        existing.quantity = min(existing.quantity + data["quantity"], 50)
    else:
        existing = CartItem(
            cart_id=cart.id, product_id=product.id,
            selected_color=data.get("selected_color"), quantity=data["quantity"],
        )
        db.session.add(existing)

    db.session.commit()
    cart = db.session.get(Cart, cart.id)
    return success({"cart": cart.to_dict()}, "Item added to cart", 201)


@cart_bp.put("/items/<int:item_id>")
@jwt_required_custom
def update_item(item_id):
    data, errors = validate_payload(CartItemUpdateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    cart = _get_or_create_cart(g.current_user.id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error("Cart item not found.", status_code=404)

    item.quantity = data["quantity"]
    db.session.commit()
    cart = db.session.get(Cart, cart.id)
    return success({"cart": cart.to_dict()}, "Cart updated")


@cart_bp.delete("/items/<int:item_id>")
@jwt_required_custom
def remove_item(item_id):
    cart = _get_or_create_cart(g.current_user.id)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return error("Cart item not found.", status_code=404)

    db.session.delete(item)
    db.session.commit()
    cart = db.session.get(Cart, cart.id)
    return success({"cart": cart.to_dict()}, "Item removed from cart")


@cart_bp.delete("")
@jwt_required_custom
def clear_cart():
    cart = _get_or_create_cart(g.current_user.id)
    CartItem.query.filter_by(cart_id=cart.id).delete()
    db.session.commit()
    return success(message="Cart cleared")


@cart_bp.post("/merge")
@jwt_required_custom
def merge_guest_cart():
    """
    Merges a guest's localStorage cart into the server cart after login.
    Body: { "items": [{ "product_id": 1, "quantity": 2, "selected_color": "Walnut" }, ...] }
    Quantities for matching product+color pairs are combined (capped at 50)
    rather than duplicated, so re-logging-in repeatedly cannot inflate cart quantities.
    """
    payload = request.get_json(silent=True) or {}
    guest_items = payload.get("items") or []
    cart = _get_or_create_cart(g.current_user.id)

    for raw in guest_items:
        product_id = raw.get("product_id")
        quantity = max(1, min(int(raw.get("quantity", 1)), 50))
        selected_color = raw.get("selected_color")

        product, err = _validate_product_and_color(product_id, selected_color)
        if err or not product or product.availability == "out_of_stock":
            continue  # skip invalid/unavailable guest items silently

        existing = CartItem.query.filter_by(
            cart_id=cart.id, product_id=product_id, selected_color=selected_color
        ).first()
        if existing:
            existing.quantity = min(existing.quantity + quantity, 50)
        else:
            db.session.add(CartItem(cart_id=cart.id, product_id=product_id,
                                     selected_color=selected_color, quantity=quantity))

    db.session.commit()
    cart = db.session.get(Cart, cart.id)
    return success({"cart": cart.to_dict()}, "Cart merged successfully")
