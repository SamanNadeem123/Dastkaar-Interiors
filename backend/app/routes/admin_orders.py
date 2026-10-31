from flask import Blueprint, request
from app.extensions import db
from app.models.order import Order
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import admin_required
from app.services.order_service import update_order_status, OrderError

admin_orders_bp = Blueprint("admin_orders", __name__, url_prefix="/api/admin/orders")


@admin_orders_bp.get("")
@admin_required
def list_orders():
    page, limit = paginate_args(request)
    q = Order.query

    status = request.args.get("status")
    if status:
        q = q.filter_by(order_status=status)

    payment_status = request.args.get("payment_status")
    if payment_status:
        q = q.filter_by(payment_status=payment_status)

    payment_method = request.args.get("payment_method")
    if payment_method:
        q = q.filter_by(payment_method=payment_method)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(
            Order.order_number.ilike(like),
            Order.customer_name.ilike(like),
            Order.customer_phone.ilike(like),
        ))

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    if date_from:
        q = q.filter(Order.created_at >= date_from)
    if date_to:
        q = q.filter(Order.created_at <= date_to)

    q = q.order_by(Order.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    return success({
        "items": [o.to_dict() for o in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@admin_orders_bp.get("/<int:order_id>")
@admin_required
def get_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return error("Order not found.", status_code=404)
    data = order.to_dict(detailed=True)
    data["status_history"] = [h.to_dict() for h in order.status_history.order_by(db.text("created_at asc"))]
    data["payments"] = [p.to_dict() for p in order.payments]
    return success({"order": data})


@admin_orders_bp.patch("/<int:order_id>/status")
@admin_required
def update_status(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return error("Order not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    new_status = payload.get("order_status")
    if not new_status:
        return error("order_status is required.", status_code=422)

    try:
        order = update_order_status(order, new_status, changed_by="admin")
    except OrderError as e:
        return error(e.message, status_code=e.status_code)

    return success({"order": order.to_dict(detailed=True)}, "Order status updated successfully")
