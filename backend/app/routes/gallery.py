from flask import Blueprint, request
from app.models.misc import GalleryImage
from app.utils.responses import success

gallery_bp = Blueprint("gallery", __name__, url_prefix="/api/gallery")


@gallery_bp.get("")
def list_gallery():
    category = request.args.get("category")
    q = GalleryImage.query.filter_by(is_active=True)
    if category:
        q = q.filter_by(category=category)
    items = q.order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc()).all()
    return success({"items": [g.to_dict() for g in items]})
