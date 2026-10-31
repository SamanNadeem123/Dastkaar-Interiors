"""
Image storage service.
Uses Cloudinary when credentials are configured. Falls back to local disk
storage under /static/uploads for local development when Cloudinary is not
configured, so the app remains fully runnable without external credentials.
"""
import os
import uuid
import logging
from flask import current_app, request

logger = logging.getLogger(__name__)

_cloudinary_configured = False


def _ensure_cloudinary():
    global _cloudinary_configured
    if _cloudinary_configured:
        return True
    cfg = current_app.config
    if cfg.get("CLOUDINARY_CLOUD_NAME") and cfg.get("CLOUDINARY_API_KEY") and cfg.get("CLOUDINARY_API_SECRET"):
        import cloudinary
        cloudinary.config(
            cloud_name=cfg["CLOUDINARY_CLOUD_NAME"],
            api_key=cfg["CLOUDINARY_API_KEY"],
            api_secret=cfg["CLOUDINARY_API_SECRET"],
            secure=True,
        )
        _cloudinary_configured = True
        return True
    return False


def allowed_file(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_IMAGE_EXTENSIONS"]


def upload_image(file_storage, folder="products"):
    """
    Uploads an image file (werkzeug FileStorage) and returns (url, public_id).
    Validates extension and size before upload.
    """
    filename = file_storage.filename or ""
    if not filename or not allowed_file(filename):
        raise ValueError("Unsupported file type. Allowed: png, jpg, jpeg, webp, gif")

    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    if size > current_app.config["MAX_CONTENT_LENGTH"]:
        raise ValueError("File too large. Maximum size is 10MB")

    if _ensure_cloudinary():
        import cloudinary.uploader
        result = cloudinary.uploader.upload(file_storage, folder=f"na_furniture_valley/{folder}")
        return result["secure_url"], result["public_id"]

    # Local fallback
    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], folder)
    os.makedirs(upload_dir, exist_ok=True)
    ext = filename.rsplit(".", 1)[-1].lower()
    new_name = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(upload_dir, new_name)
    file_storage.save(path)
    # Build an absolute URL (not just the path) since the frontend runs on a
    # different origin/port than the API in local dev - a relative "/static/..."
    # URL would otherwise resolve against the frontend's own origin and 404.
    url = f"{request.host_url.rstrip('/')}/static/uploads/{folder}/{new_name}"
    return url, None


def delete_image(public_id):
    if not public_id:
        return
    try:
        if _ensure_cloudinary():
            import cloudinary.uploader
            cloudinary.uploader.destroy(public_id)
    except Exception as e:
        logger.warning("Failed to delete image %s: %s", public_id, e)
