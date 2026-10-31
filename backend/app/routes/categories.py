from flask import Blueprint
from app.models.category import Category
from app.utils.responses import success, error

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
def list_categories():
    categories = Category.query.filter_by(is_active=True).order_by(Category.sort_order.asc(), Category.name.asc()).all()
    return success({"items": [c.to_dict(with_count=True) for c in categories]})


@categories_bp.get("/<string:slug>")
def get_category(slug):
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        return error("Category not found.", status_code=404)
    return success({"category": category.to_dict(with_count=True)})
