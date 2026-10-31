from flask import Blueprint
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.user import User
from app.utils.responses import success
from app.middleware.auth import admin_required

admin_dashboard_bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/admin/dashboard")


@admin_dashboard_bp.get("/stats")
@admin_required
def get_stats():
    """All figures are computed live from the database - never fabricated."""
    total_products = Product.query.filter_by(is_active=True).count()
    total_categories = Category.query.filter_by(is_active=True).count()
    total_orders = Order.query.count()
    total_customers = User.query.filter_by(role="customer").count()

    status_counts = {}
    for status in ("pending", "confirmed", "processing", "shipped", "delivered", "cancelled"):
        status_counts[status] = Order.query.filter_by(order_status=status).count()

    total_sales = db.session.query(db.func.coalesce(db.func.sum(Order.total), 0)).filter(
        Order.payment_status == "paid"
    ).scalar()

    low_stock = Product.query.filter(
        Product.is_active.is_(True), Product.availability == "in_stock",
        Product.stock_quantity > 0, Product.stock_quantity <= 5,
    ).count()
    out_of_stock = Product.query.filter_by(is_active=True, availability="out_of_stock").count()

    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(8).all()
    recent_products = Product.query.filter_by(is_active=True).order_by(Product.created_at.desc()).limit(8).all()

    return success({
        "total_products": total_products,
        "total_categories": total_categories,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_sales": float(total_sales or 0),
        "orders_by_status": status_counts,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "recent_orders": [o.to_dict() for o in recent_orders],
        "recent_products": [p.to_dict() for p in recent_products],
    })
