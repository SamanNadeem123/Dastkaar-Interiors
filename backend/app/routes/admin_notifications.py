from flask import Blueprint, request
from app.extensions import db
from app.models.misc import Notification
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import admin_required

admin_notifications_bp = Blueprint("admin_notifications", __name__, url_prefix="/api/admin/notifications")


@admin_notifications_bp.get("")
@admin_required
def list_notifications():
    page, limit = paginate_args(request, default_limit=15)
    q = Notification.query.order_by(Notification.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    unread_count = Notification.query.filter_by(is_read=False).count()
    return success({
        "items": [n.to_dict() for n in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
        "unread_count": unread_count,
    })


@admin_notifications_bp.patch("/<int:notification_id>/read")
@admin_required
def mark_read(notification_id):
    notification = db.session.get(Notification, notification_id)
    if not notification:
        return error("Notification not found.", status_code=404)
    notification.is_read = True
    db.session.commit()
    return success(message="Notification marked as read")


@admin_notifications_bp.patch("/read-all")
@admin_required
def mark_all_read():
    Notification.query.filter_by(is_read=False).update({"is_read": True})
    db.session.commit()
    return success(message="All notifications marked as read")
