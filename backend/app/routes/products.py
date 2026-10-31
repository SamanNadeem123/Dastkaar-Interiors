from flask import Blueprint, request
from sqlalchemy import or_, and_
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.utils.responses import success, error
from app.utils.validators import paginate_args

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

SORT_OPTIONS = {
    "newest": lambda q: q.order_by(Product.created_at.desc()),
    "price_low": lambda q: q.order_by(db.func.coalesce(Product.sale_price, Product.original_price).asc()),
    "price_high": lambda q: q.order_by(db.func.coalesce(Product.sale_price, Product.original_price).desc()),
    "featured": lambda q: q.order_by(Product.is_featured.desc(), Product.created_at.desc()),
    "discount": lambda q: q.order_by(
        (Product.original_price - db.func.coalesce(Product.sale_price, Product.original_price)).desc()
    ),
    "popular": lambda q: q.order_by(Product.is_featured.desc(), Product.stock_quantity.asc()),
}


def _base_query(include_inactive=False):
    q = Product.query
    if not include_inactive:
        q = q.filter(Product.is_active.is_(True))
    return q


def _apply_filters(q):
    args = request.args

    search = args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        q = q.join(Category, isouter=True).filter(
            or_(
                Product.name.ilike(like),
                Product.sku.ilike(like),
                Product.description.ilike(like),
                Product.short_description.ilike(like),
                Product.material.ilike(like),
                Product.wood_type.ilike(like),
                Category.name.ilike(like),
            )
        )

    category_slug = args.get("category")
    if category_slug:
        q = q.join(Category, Product.category_id == Category.id).filter(Category.slug == category_slug)

    material = args.get("material")
    if material:
        q = q.filter(Product.material == material)

    wood_type = args.get("wood_type")
    if wood_type:
        q = q.filter(Product.wood_type == wood_type)

    availability = args.get("availability")
    if availability:
        q = q.filter(Product.availability == availability)

    color = args.get("color")
    if color:
        # Use a subquery rather than a join so we never duplicate Product rows
        # (a product can have many colors) - this also means DISTINCT/ORDER BY
        # never need to interact, which PostgreSQL is strict about.
        from app.models.product import ProductColor
        color_subq = db.session.query(ProductColor.product_id).filter(ProductColor.color_name == color)
        q = q.filter(Product.id.in_(color_subq))

    if args.get("featured") == "true":
        q = q.filter(Product.is_featured.is_(True))
    if args.get("is_new") == "true":
        q = q.filter(Product.is_new.is_(True))
    if args.get("on_sale") == "true":
        q = q.filter(Product.is_on_sale.is_(True), Product.sale_price.isnot(None))

    min_price = args.get("min_price")
    max_price = args.get("max_price")
    effective_price = db.func.coalesce(Product.sale_price, Product.original_price)
    if min_price:
        try:
            q = q.filter(effective_price >= float(min_price))
        except ValueError:
            pass
    if max_price:
        try:
            q = q.filter(effective_price <= float(max_price))
        except ValueError:
            pass

    return q


@products_bp.get("")
def list_products():
    q = _base_query()
    q = _apply_filters(q)

    # No .distinct() needed: the category join is many-to-one (never
    # duplicates rows) and the color filter now uses a subquery instead of a
    # join, so the base product query is already duplicate-free. This also
    # avoids PostgreSQL's restriction that DISTINCT + ORDER BY-by-expression
    # requires the expression to appear in the SELECT list.
    sort = request.args.get("sort", "newest")
    sort_fn = SORT_OPTIONS.get(sort, SORT_OPTIONS["newest"])
    q = sort_fn(q)

    page, limit = paginate_args(request)
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    total_pages = max((total + limit - 1) // limit, 1)

    return success({
        "items": [p.to_dict() for p in items],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    })


@products_bp.get("/filters")
def get_filter_options():
    """Returns distinct filterable values so the frontend can render filter controls
    without loading every product."""
    materials = [r[0] for r in db.session.query(Product.material).filter(
        Product.material.isnot(None), Product.is_active.is_(True)).distinct() if r[0]]
    wood_types = [r[0] for r in db.session.query(Product.wood_type).filter(
        Product.wood_type.isnot(None), Product.is_active.is_(True)).distinct() if r[0]]
    from app.models.product import ProductColor
    colors = [r[0] for r in db.session.query(ProductColor.color_name).join(
        Product, Product.id == ProductColor.product_id).filter(Product.is_active.is_(True)).distinct()]
    prices = db.session.query(
        db.func.min(db.func.coalesce(Product.sale_price, Product.original_price)),
        db.func.max(db.func.coalesce(Product.sale_price, Product.original_price)),
    ).filter(Product.is_active.is_(True)).first()

    return success({
        "materials": sorted(materials),
        "wood_types": sorted(wood_types),
        "colors": sorted(colors),
        "min_price": float(prices[0]) if prices and prices[0] is not None else 0,
        "max_price": float(prices[1]) if prices and prices[1] is not None else 0,
    })


@products_bp.get("/<string:slug>")
def get_product(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first()
    if not product:
        return error("Product not found.", status_code=404)
    return success({"product": product.to_dict(detailed=True)})


@products_bp.get("/<string:slug>/related")
def get_related_products(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first()
    if not product:
        return error("Product not found.", status_code=404)

    price = product.effective_price
    related = Product.query.filter(
        Product.id != product.id,
        Product.is_active.is_(True),
        or_(
            Product.category_id == product.category_id,
            Product.material == product.material,
            and_(
                db.func.coalesce(Product.sale_price, Product.original_price) >= price * 0.7,
                db.func.coalesce(Product.sale_price, Product.original_price) <= price * 1.3,
            ),
        ),
    ).order_by(Product.is_featured.desc()).limit(8).all()

    return success({"items": [p.to_dict() for p in related]})
