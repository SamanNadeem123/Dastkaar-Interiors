from flask import Blueprint, request
from app.extensions import db
from app.models.misc import Review
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import admin_required

admin_reviews_bp = Blueprint("admin_reviews", __name__, url_prefix="/api/admin/reviews")


@admin_reviews_bp.get("")
@admin_required
def list_reviews():
    page, limit = paginate_args(request)
    status = request.args.get("status")
    q = Review.query
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(Review.created_at.desc())

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return success({
        "items": [r.to_dict() for r in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@admin_reviews_bp.patch("/<int:review_id>")
@admin_required
def moderate_review(review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return error("Review not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ("approved", "rejected", "pending"):
        return error("Invalid status. Must be approved, rejected, or pending.", status_code=422)

    review.status = status
    db.session.commit()
    return success({"review": review.to_dict()}, f"Review {status} successfully")


@admin_reviews_bp.delete("/<int:review_id>")
@admin_required
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return error("Review not found.", status_code=404)
    db.session.delete(review)
    db.session.commit()
    return success(message="Review deleted successfully")
