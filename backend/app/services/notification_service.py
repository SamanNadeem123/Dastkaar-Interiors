import logging
from app.extensions import db, socketio
from app.models.misc import Notification

logger = logging.getLogger(__name__)

ADMIN_ROOM = "admin_room"


def notify_admins_new_order(order):
    """Persist an admin notification and push it in real-time via Socket.IO
    to the admin-only room. Never raises - notification failure must not
    break order creation."""
    try:
        notification = Notification(
            user_id=None,
            type="order",
            title="New Order Received",
            message=f"{order.order_number} — {order.customer_name} — PKR {float(order.total):,.0f} ({order.payment_method.upper()})",
            related_order_id=order.id,
        )
        db.session.add(notification)
        db.session.commit()

        payload = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "total": float(order.total),
            "payment_method": order.payment_method,
            "order_id": order.id,
            "created_at": notification.created_at.isoformat(),
        }
        socketio.emit("new_order", payload, room=ADMIN_ROOM)
        socketio.emit("notification_count_update", {"unread_count": get_unread_count()}, room=ADMIN_ROOM)
    except Exception as e:
        logger.error("Failed to create/send admin notification: %s", e)


def get_unread_count():
    try:
        return Notification.query.filter_by(is_read=False).count()
    except Exception:
        return 0


def notify_customer_status_update(order):
    """Emit a status-update event to a customer-specific room if they are
    tracking their order (best-effort, never raises)."""
    try:
        socketio.emit(
            "order_status_update",
            {"order_number": order.order_number, "order_status": order.order_status},
            room=f"order_{order.order_number}",
        )
    except Exception as e:
        logger.warning("Failed to emit order status update: %s", e)
