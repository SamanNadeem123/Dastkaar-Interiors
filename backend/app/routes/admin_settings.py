from flask import Blueprint, request
from app.extensions import db
from app.models.misc import Setting
from app.schemas.misc_schemas import SettingsUpdateSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.middleware.auth import admin_required
from app.services import cloudinary_service

admin_settings_bp = Blueprint("admin_settings", __name__, url_prefix="/api/admin/settings")


@admin_settings_bp.get("")
@admin_required
def get_settings():
    rows = {s.key: s.value for s in Setting.query.all()}
    merged = dict(Setting.DEFAULTS)
    merged.update({k: v for k, v in rows.items() if v is not None})
    return success({"settings": merged})


@admin_settings_bp.put("")
@admin_required
def update_settings():
    data, errors = validate_payload(SettingsUpdateSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if not setting:
            setting = Setting(key=key)
            db.session.add(setting)
        setting.value = str(value)

    db.session.commit()
    rows = {s.key: s.value for s in Setting.query.all()}
    merged = dict(Setting.DEFAULTS)
    merged.update(rows)
    return success({"settings": merged}, "Settings updated successfully")


@admin_settings_bp.post("/logo")
@admin_required
def upload_logo():
    file = request.files.get("logo")
    if not file:
        return error("No logo file provided.", status_code=400)

    try:
        url, _ = cloudinary_service.upload_image(file, folder="branding")
    except ValueError as e:
        return error(str(e), status_code=400)

    setting = Setting.query.filter_by(key="logo_url").first()
    if not setting:
        setting = Setting(key="logo_url")
        db.session.add(setting)
    setting.value = url
    db.session.commit()
    return success({"logo_url": url}, "Logo updated successfully")
