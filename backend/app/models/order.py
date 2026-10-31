from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


ORDER_STATUSES = ("pending", "confirmed", "processing", "shipped", "delivered", "cancelled")
PAYMENT_STATUSES = ("pending", "paid", "failed", "refunded")
PAYMENT_METHODS = ("cod", "card")


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    customer_name = db.Column(db.String(150), nullable=False)
    customer_email = db.Column(db.String(150), nullable=True)
    customer_phone = db.Column(db.String(30), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=True)

    subtotal = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    delivery_charge = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    payment_method = db.Column(db.String(20), nullable=False, default="cod")
    payment_status = db.Column(db.String(20), nullable=False, default="pending")
    order_status = db.Column(db.String(20), nullable=False, default="pending")

    idempotency_key = db.Column(db.String(80), unique=True, nullable=True, index=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    items = db.relationship("OrderItem", backref="order", lazy="joined", cascade="all, delete-orphan")
    status_history = db.relationship("OrderStatusHistory", backref="order", lazy="dynamic", cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="order", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, detailed=False):
        data = {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "customer_phone": self.customer_phone,
            "city": self.city,
            "subtotal": float(self.subtotal),
            "discount": float(self.discount),
            "delivery_charge": float(self.delivery_charge),
            "total": float(self.total),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "order_status": self.order_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if detailed:
            data.update({
                "address": self.address,
                "postal_code": self.postal_code,
                "items": [i.to_dict() for i in self.items],
            })
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)

    product_name_snapshot = db.Column(db.String(200), nullable=False)
    product_image_snapshot = db.Column(db.String(500), nullable=True)
    selected_color = db.Column(db.String(60), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    discount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    line_total = db.Column(db.Numeric(12, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name_snapshot,
            "product_image": self.product_image_snapshot,
            "selected_color": self.selected_color,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "discount": float(self.discount),
            "line_total": float(self.line_total),
        }


class OrderStatusHistory(db.Model):
    __tablename__ = "order_status_history"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    old_status = db.Column(db.String(20), nullable=True)
    new_status = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {
            "old_status": self.old_status,
            "new_status": self.new_status,
            "changed_by": self.changed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    provider = db.Column(db.String(30), nullable=False, default="sandbox")
    transaction_id = db.Column(db.String(120), nullable=True, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(10), default="PKR")
    status = db.Column(db.String(20), default="pending")
    payment_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "provider": self.provider,
            "transaction_id": self.transaction_id,
            "amount": float(self.amount),
            "currency": self.currency,
            "status": self.status,
        }
