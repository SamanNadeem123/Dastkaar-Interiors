from flask import Blueprint, request, g
from app.extensions import db, limiter
from app.models.misc import Review
from app.schemas.misc_schemas import ReviewCreateSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.utils.validators import paginate_args
from app.middleware.auth import optional_jwt

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


@reviews_bp.get("")
def list_reviews():
    """Only approved reviews are ever visible publicly."""
    page, limit = paginate_args(request)
    product_id = request.args.get("product_id")

    q = Review.query.filter_by(status="approved")
    if product_id:
        q = q.filter_by(product_id=product_id)
    q = q.order_by(Review.created_at.desc())

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return success({
        "items": [r.to_dict() for r in items],
        "page": page, "limit": limit, "total": total,
        "total_pages": max((total + limit - 1) // limit, 1),
    })


@reviews_bp.post("")
@limiter.limit("5 per minute")
@optional_jwt
def submit_review():
    """Any legitimate visitor can submit a review, but it starts as 'pending'
    and only becomes public once an admin approves it (see admin_reviews.py),
    which protects the storefront from unmoderated/spam content."""
    data, errors = validate_payload(ReviewCreateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    user = g.get("current_user")
    review = Review(
        user_id=user.id if user else None,
        product_id=data.get("product_id"),
        customer_name=user.full_name if user else data["customer_name"],
        rating=data["rating"],
        comment=data.get("comment"),
        image_url=data.get("image_url"),
        status="pending",
    )
    db.session.add(review)
    db.session.commit()
    return success({"review": review.to_dict()}, "Thank you! Your review has been submitted for approval.", 201)
