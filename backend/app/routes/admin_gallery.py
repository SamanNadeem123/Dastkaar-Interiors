from flask import Blueprint, request
from app.extensions import db
from app.models.misc import GalleryImage
from app.schemas.misc_schemas import GalleryImageSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.middleware.auth import admin_required
from app.services import cloudinary_service

admin_gallery_bp = Blueprint("admin_gallery", __name__, url_prefix="/api/admin/gallery")


@admin_gallery_bp.get("")
@admin_required
def list_gallery():
    items = GalleryImage.query.order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc()).all()
    return success({"items": [g.to_dict() for g in items]})


@admin_gallery_bp.post("")
@admin_required
def upload_gallery_image():
    file = request.files.get("image")
    if not file:
        return error("No image file provided.", status_code=400)

    data, errors = validate_payload(GalleryImageSchema(), request.form.to_dict())
    if errors:
        return error("Validation failed", errors, 422)

    try:
        url, public_id = cloudinary_service.upload_image(file, folder="gallery")
    except ValueError as e:
        return error(str(e), status_code=400)

    max_sort = db.session.query(db.func.max(GalleryImage.sort_order)).scalar() or 0
    image = GalleryImage(
        title=data.get("title"), category=data.get("category"),
        image_url=url, public_id=public_id,
        is_active=data.get("is_active", True), sort_order=data.get("sort_order", max_sort + 1),
    )
    db.session.add(image)
    db.session.commit()
    return success({"image": image.to_dict()}, "Gallery image uploaded successfully", 201)


@admin_gallery_bp.put("/<int:image_id>")
@admin_required
def update_gallery_image(image_id):
    image = db.session.get(GalleryImage, image_id)
    if not image:
        return error("Gallery image not found.", status_code=404)

    data, errors = validate_payload(GalleryImageSchema(partial=True), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    for field in ("title", "category", "is_active", "sort_order"):
        if field in data:
            setattr(image, field, data[field])

    db.session.commit()
    return success({"image": image.to_dict()}, "Gallery image updated successfully")


@admin_gallery_bp.delete("/<int:image_id>")
@admin_required
def delete_gallery_image(image_id):
    image = db.session.get(GalleryImage, image_id)
    if not image:
        return error("Gallery image not found.", status_code=404)

    cloudinary_service.delete_image(image.public_id)
    db.session.delete(image)
    db.session.commit()
    return success(message="Gallery image deleted successfully")
