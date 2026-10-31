from flask import Blueprint, request
from app.extensions import db
from app.models.user import User
from app.models.order import Order
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import admin_required

admin_customers_bp = Blueprint("admin_customers", __name__, url_prefix="/api/admin/customers")


@admin_customers_bp.get("")
@admin_required
def list_customers():
    page, limit = paginate_args(request)
    q = User.query.filter_by(role="customer")

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))

    q = q.order_by(User.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    # Never expose password hashes - to_dict() already omits them by design.
    return success({
        "items": [c.to_dict(include_stats=True) for c in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@admin_customers_bp.get("/<int:customer_id>")
@admin_required
def get_customer(customer_id):
    customer = User.query.filter_by(id=customer_id, role="customer").first()
    if not customer:
        return error("Customer not found.", status_code=404)

    orders = Order.query.filter_by(user_id=customer.id).order_by(Order.created_at.desc()).all()
    data = customer.to_dict(include_stats=True)
    data["orders"] = [o.to_dict() for o in orders]
    return success({"customer": data})
