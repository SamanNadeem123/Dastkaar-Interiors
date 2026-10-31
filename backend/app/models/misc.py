from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class DeliveryZone(db.Model):
    __tablename__ = "delivery_zones"

    id = db.Column(db.Integer, primary_key=True)
    city_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    fee = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "city_name": self.city_name,
            "fee": float(self.fee),
            "is_active": self.is_active,
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    customer_name = db.Column(db.String(150), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "rating": self.rating,
            "comment": self.comment,
            "image_url": self.image_url,
            "status": self.status,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)  # null = broadcast to all admins
    type = db.Column(db.String(40), nullable=False, default="order")
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    related_order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "related_order_id": self.related_order_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class GalleryImage(db.Model):
    __tablename__ = "gallery_images"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=True)
    category = db.Column(db.String(80), nullable=True)  # Living Room, Bedroom, etc
    image_url = db.Column(db.String(500), nullable=False)
    public_id = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "sort_order": self.sort_order,
        }


class Setting(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(80), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    DEFAULTS = {
        "store_name": "NA FURNITURE VALLEY",
        "logo_url": "",
        "phone": "+92 300 0000000",
        "email": "info@nafurniturevalley.com",
        "whatsapp": "923000000000",
        "address": "Main Boulevard, Lahore, Pakistan",
        "opening_hours": "Mon - Sat: 11:00 AM - 9:00 PM",
        "facebook_url": "",
        "instagram_url": "",
        "currency": "PKR",
        "default_delivery_charge": "3000",
        "admin_notification_email": "admin@nafurniturevalley.com",
    }
