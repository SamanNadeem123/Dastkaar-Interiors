from flask import Blueprint, request
from app.extensions import db
from app.models.product import Product, ProductImage, ProductColor
from app.models.category import Category
from app.schemas.product_schemas import ProductCreateSchema, ProductUpdateSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.utils.slugify import slugify, unique_slug, generate_sku
from app.middleware.auth import admin_required
from app.services import cloudinary_service

admin_products_bp = Blueprint("admin_products", __name__, url_prefix="/api/admin/products")


def _slug_exists(slug, current_id=None):
    q = Product.query.filter_by(slug=slug)
    if current_id:
        q = q.filter(Product.id != current_id)
    return q.first() is not None


def _sku_exists(sku, current_id=None):
    q = Product.query.filter_by(sku=sku)
    if current_id:
        q = q.filter(Product.id != current_id)
    return q.first() is not None


@admin_products_bp.get("")
@admin_required
def list_products():
    page, limit = paginate_args(request)
    q = Product.query.filter_by()  # includes inactive - admin sees everything

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(Product.name.ilike(like), Product.sku.ilike(like)))

    category_id = request.args.get("category_id")
    if category_id:
        q = q.filter_by(category_id=category_id)

    status = request.args.get("status")
    if status == "active":
        q = q.filter_by(is_active=True)
    elif status == "inactive":
        q = q.filter_by(is_active=False)

    availability = request.args.get("availability")
    if availability:
        q = q.filter_by(availability=availability)

    sort = request.args.get("sort", "newest")
    if sort == "newest":
        q = q.order_by(Product.created_at.desc())
    elif sort == "price_low":
        q = q.order_by(Product.original_price.asc())
    elif sort == "price_high":
        q = q.order_by(Product.original_price.desc())
    elif sort == "stock_low":
        q = q.order_by(Product.stock_quantity.asc())

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return success({
        "items": [p.to_dict(detailed=True) for p in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@admin_products_bp.get("/<int:product_id>")
@admin_required
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Product not found.", status_code=404)
    return success({"product": product.to_dict(detailed=True)})


@admin_products_bp.post("")
@admin_required
def create_product():
    data, errors = validate_payload(ProductCreateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    category = db.session.get(Category, data["category_id"])
    if not category:
        return error("Selected category does not exist.", {"category_id": ["Invalid category"]}, 422)

    sku = (data.get("sku") or "").strip() or generate_sku()
    if _sku_exists(sku):
        return error("This SKU is already in use.", {"sku": ["Already exists"]}, 409)

    slug = unique_slug(data["name"], _slug_exists)

    if data.get("sale_price") is not None and float(data["sale_price"]) >= float(data["original_price"]):
        data["sale_price"] = None  # never store/display a fake discount

    product = Product(
        category_id=data["category_id"], name=data["name"], slug=slug, sku=sku,
        short_description=data.get("short_description"), description=data.get("description"),
        original_price=data["original_price"], sale_price=data.get("sale_price"),
        material=data.get("material"), wood_type=data.get("wood_type"),
        width=data.get("width"), height=data.get("height"), depth=data.get("depth"),
        length=data.get("length"), weight=data.get("weight"), dimension_unit=data.get("dimension_unit", "in"),
        availability=data.get("availability", "in_stock"), stock_quantity=data.get("stock_quantity", 0),
        is_featured=data.get("is_featured", False), is_new=data.get("is_new", False),
        is_on_sale=data.get("is_on_sale", False), is_active=data.get("is_active", True),
    )
    db.session.add(product)
    db.session.flush()

    for c in data.get("colors", []):
        db.session.add(ProductColor(product_id=product.id, color_name=c["color_name"], color_code=c.get("color_code")))

    db.session.commit()
    return success({"product": product.to_dict(detailed=True)}, "Product created successfully", 201)


@admin_products_bp.put("/<int:product_id>")
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Product not found.", status_code=404)

    data, errors = validate_payload(ProductUpdateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    if "category_id" in data and data["category_id"] is not None:
        if not db.session.get(Category, data["category_id"]):
            return error("Selected category does not exist.", {"category_id": ["Invalid category"]}, 422)
        product.category_id = data["category_id"]

    if "sku" in data and data["sku"] and data["sku"] != product.sku:
        if _sku_exists(data["sku"], product.id):
            return error("This SKU is already in use.", {"sku": ["Already exists"]}, 409)
        product.sku = data["sku"]

    # Slug is preserved unless the name actually changes, to avoid breaking
    # existing links/SEO on every unrelated edit.
    if "name" in data and data["name"] and data["name"] != product.name:
        product.name = data["name"]
        product.slug = unique_slug(data["name"], _slug_exists, current_id=product.id)

    for field in ("short_description", "description", "material", "wood_type",
                  "width", "height", "depth", "length", "weight", "dimension_unit",
                  "availability", "stock_quantity", "is_featured", "is_new",
                  "is_on_sale", "is_active", "original_price"):
        if field in data:
            setattr(product, field, data[field])

    if "sale_price" in data:
        sale_price = data["sale_price"]
        original = float(data.get("original_price", product.original_price))
        if sale_price is not None and float(sale_price) >= original:
            sale_price = None  # never store a fake/negative discount
        product.sale_price = sale_price

    if "colors" in data:
        ProductColor.query.filter_by(product_id=product.id).delete()
        for c in data["colors"]:
            db.session.add(ProductColor(product_id=product.id, color_name=c["color_name"], color_code=c.get("color_code")))

    db.session.commit()
    return success({"product": product.to_dict(detailed=True)}, "Product updated successfully")


@admin_products_bp.delete("/<int:product_id>")
@admin_required
def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Product not found.", status_code=404)

    # Soft-delete (archive) rather than hard delete, so historical order
    # snapshots (which reference product_id) remain intact and consistent.
    product.is_active = False
    db.session.commit()
    return success(message="Product archived successfully")


@admin_products_bp.post("/<int:product_id>/restore")
@admin_required
def restore_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Product not found.", status_code=404)
    product.is_active = True
    db.session.commit()
    return success({"product": product.to_dict(detailed=True)}, "Product restored")


@admin_products_bp.post("/<int:product_id>/images")
@admin_required
def upload_images(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Product not found.", status_code=404)

    files = request.files.getlist("images")
    if not files:
        return error("No image files provided.", status_code=400)

    max_sort = max([img.sort_order for img in product.images], default=-1)
    created = []
    for i, f in enumerate(files):
        try:
            url, public_id = cloudinary_service.upload_image(f, folder="products")
        except ValueError as e:
            return error(str(e), status_code=400)

        is_primary = not product.images and i == 0
        img = ProductImage(product_id=product.id, image_url=url, public_id=public_id,
                            is_primary=is_primary, sort_order=max_sort + i + 1)
        db.session.add(img)
        created.append(img)

    db.session.commit()
    return success({"images": [i.to_dict() for i in created]}, "Images uploaded successfully", 201)


@admin_products_bp.delete("/<int:product_id>/images/<int:image_id>")
@admin_required
def delete_image(product_id, image_id):
    image = ProductImage.query.filter_by(id=image_id, product_id=product_id).first()
    if not image:
        return error("Image not found.", status_code=404)

    cloudinary_service.delete_image(image.public_id)
    was_primary = image.is_primary
    db.session.delete(image)
    db.session.flush()

    if was_primary:
        next_image = ProductImage.query.filter_by(product_id=product_id).order_by(ProductImage.sort_order.asc()).first()
        if next_image:
            next_image.is_primary = True

    db.session.commit()
    return success(message="Image deleted successfully")


@admin_products_bp.put("/<int:product_id>/images/<int:image_id>/primary")
@admin_required
def set_primary_image(product_id, image_id):
    image = ProductImage.query.filter_by(id=image_id, product_id=product_id).first()
    if not image:
        return error("Image not found.", status_code=404)

    ProductImage.query.filter_by(product_id=product_id).update({"is_primary": False})
    image.is_primary = True
    db.session.commit()
    return success(message="Primary image updated")


@admin_products_bp.put("/<int:product_id>/images/reorder")
@admin_required
def reorder_images(product_id):
    payload = request.get_json(silent=True) or {}
    order = payload.get("order") or []  # list of image ids in desired order
    for index, image_id in enumerate(order):
        ProductImage.query.filter_by(id=image_id, product_id=product_id).update({"sort_order": index})
    db.session.commit()
    product = db.session.get(Product, product_id)
    return success({"images": [i.to_dict() for i in product.images]}, "Image order updated")
