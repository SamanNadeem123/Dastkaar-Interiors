from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


AVAILABILITY_CHOICES = ("in_stock", "out_of_stock", "made_to_order", "coming_soon")


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)

    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), unique=True, nullable=False, index=True)
    sku = db.Column(db.String(60), unique=True, nullable=False, index=True)

    short_description = db.Column(db.String(300), nullable=True)
    description = db.Column(db.Text, nullable=True)

    original_price = db.Column(db.Numeric(12, 2), nullable=False)
    sale_price = db.Column(db.Numeric(12, 2), nullable=True)

    material = db.Column(db.String(120), nullable=True, index=True)
    wood_type = db.Column(db.String(120), nullable=True, index=True)

    width = db.Column(db.Numeric(10, 2), nullable=True)
    height = db.Column(db.Numeric(10, 2), nullable=True)
    depth = db.Column(db.Numeric(10, 2), nullable=True)
    length = db.Column(db.Numeric(10, 2), nullable=True)
    weight = db.Column(db.Numeric(10, 2), nullable=True)
    dimension_unit = db.Column(db.String(10), default="in")  # in | ft | cm | kg(weight)

    availability = db.Column(db.String(20), default="in_stock")
    stock_quantity = db.Column(db.Integer, default=0)

    is_featured = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)
    is_on_sale = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    images = db.relationship(
        "ProductImage", backref="product", lazy="joined",
        order_by="ProductImage.sort_order", cascade="all, delete-orphan"
    )
    colors = db.relationship("ProductColor", backref="product", lazy="joined", cascade="all, delete-orphan")

    @property
    def effective_price(self):
        if self.sale_price is not None and float(self.sale_price) > 0 and float(self.sale_price) < float(self.original_price):
            return float(self.sale_price)
        return float(self.original_price)

    @property
    def discount_percent(self):
        if self.sale_price is not None and float(self.sale_price) > 0 and float(self.sale_price) < float(self.original_price):
            return round((1 - (float(self.sale_price) / float(self.original_price))) * 100, 2)
        return 0

    def to_dict(self, detailed=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "sku": self.sku,
            "short_description": self.short_description,
            "category": {"id": self.category.id, "name": self.category.name, "slug": self.category.slug} if self.category else None,
            "original_price": float(self.original_price),
            "sale_price": float(self.sale_price) if self.sale_price is not None else None,
            "effective_price": self.effective_price,
            "discount_percent": self.discount_percent,
            "availability": self.availability,
            "stock_quantity": self.stock_quantity,
            "is_featured": self.is_featured,
            "is_new": self.is_new,
            "is_on_sale": self.is_on_sale,
            "is_active": self.is_active,
            "images": [img.to_dict() for img in self.images],
            "primary_image": next((img.image_url for img in self.images if img.is_primary), (self.images[0].image_url if self.images else None)),
            "colors": [c.to_dict() for c in self.colors],
        }
        if detailed:
            data.update({
                "description": self.description,
                "material": self.material,
                "wood_type": self.wood_type,
                "width": float(self.width) if self.width is not None else None,
                "height": float(self.height) if self.height is not None else None,
                "depth": float(self.depth) if self.depth is not None else None,
                "length": float(self.length) if self.length is not None else None,
                "weight": float(self.weight) if self.weight is not None else None,
                "dimension_unit": self.dimension_unit,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            })
        return data


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    public_id = db.Column(db.String(255), nullable=True)  # cloudinary public id, for deletion
    is_primary = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "image_url": self.image_url,
            "is_primary": self.is_primary,
            "sort_order": self.sort_order,
        }


class ProductColor(db.Model):
    __tablename__ = "product_colors"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    color_name = db.Column(db.String(60), nullable=False)
    color_code = db.Column(db.String(20), nullable=True)  # hex code
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {"id": self.id, "color_name": self.color_name, "color_code": self.color_code}
