from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    items = db.relationship("CartItem", backref="cart", lazy="joined", cascade="all, delete-orphan")

    def to_dict(self):
        items = [i.to_dict() for i in self.items]
        subtotal = sum(i["line_total"] for i in items)
        return {"id": self.id, "items": items, "subtotal": subtotal}


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    selected_color = db.Column(db.String(60), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    product = db.relationship("Product")

    def to_dict(self):
        unit_price = self.product.effective_price if self.product else 0
        return {
            "id": self.id,
            "product": self.product.to_dict() if self.product else None,
            "selected_color": self.selected_color,
            "quantity": self.quantity,
            "unit_price": unit_price,
            "line_total": round(unit_price * self.quantity, 2),
        }


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    address_line = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=True)
    is_default = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "phone": self.phone,
            "address_line": self.address_line,
            "city": self.city,
            "postal_code": self.postal_code,
            "is_default": self.is_default,
        }
