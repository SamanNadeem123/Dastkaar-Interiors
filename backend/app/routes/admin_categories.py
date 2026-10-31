from flask import Blueprint, request
from app.extensions import db
from app.models.category import Category
from app.models.product import Product
from app.schemas.product_schemas import CategorySchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.utils.slugify import unique_slug
from app.middleware.auth import admin_required
from app.services import cloudinary_service

admin_categories_bp = Blueprint("admin_categories", __name__, url_prefix="/api/admin/categories")


def _slug_exists(slug, current_id=None):
    q = Category.query.filter_by(slug=slug)
    if current_id:
        q = q.filter(Category.id != current_id)
    return q.first() is not None


@admin_categories_bp.get("")
@admin_required
def list_categories():
    categories = Category.query.order_by(Category.sort_order.asc(), Category.name.asc()).all()
    return success({"items": [c.to_dict(with_count=True) for c in categories]})


@admin_categories_bp.post("")
@admin_required
def create_category():
    data, errors = validate_payload(CategorySchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    category = Category(
        name=data["name"], slug=unique_slug(data["name"], _slug_exists),
        description=data.get("description"), image_url=data.get("image_url"),
        is_active=data.get("is_active", True), sort_order=data.get("sort_order", 0),
    )
    db.session.add(category)
    db.session.commit()
    return success({"category": category.to_dict()}, "Category created successfully", 201)


@admin_categories_bp.put("/<int:category_id>")
@admin_required
def update_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return error("Category not found.", status_code=404)

    data, errors = validate_payload(CategorySchema(partial=True), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    if data.get("name") and data["name"] != category.name:
        category.name = data["name"]
        category.slug = unique_slug(data["name"], _slug_exists, current_id=category.id)

    for field in ("description", "image_url", "is_active", "sort_order"):
        if field in data:
            setattr(category, field, data[field])

    db.session.commit()
    return success({"category": category.to_dict()}, "Category updated successfully")


@admin_categories_bp.post("/<int:category_id>/image")
@admin_required
def upload_category_image(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return error("Category not found.", status_code=404)

    file = request.files.get("image")
    if not file:
        return error("No image file provided.", status_code=400)

    try:
        url, _ = cloudinary_service.upload_image(file, folder="categories")
    except ValueError as e:
        return error(str(e), status_code=400)

    category.image_url = url
    db.session.commit()
    return success({"category": category.to_dict()}, "Category image updated")


@admin_categories_bp.delete("/<int:category_id>")
@admin_required
def delete_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return error("Category not found.", status_code=404)

    product_count = Product.query.filter_by(category_id=category_id).count()
    if product_count > 0:
        # Never allow a destructive delete that would orphan products.
        # The admin must reassign products first, or simply archive the category.
        category.is_active = False
        db.session.commit()
        return success(
            {"category": category.to_dict()},
            f"This category has {product_count} product(s) and cannot be deleted. "
            f"It has been archived (deactivated) instead. Reassign its products to delete it permanently.",
        )

    db.session.delete(category)
    db.session.commit()
    return success(message="Category deleted successfully")
