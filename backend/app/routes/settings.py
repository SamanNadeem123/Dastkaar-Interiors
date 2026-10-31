from flask import Blueprint, current_app
from app.models.misc import Setting
from app.utils.responses import success

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_bp.get("")
def get_public_settings():
    """Returns store-wide configurable business info so it is never
    hard-coded across multiple frontend components (navbar, footer, contact
    page, WhatsApp buttons, etc.) - the showroom owner can update it from
    /admin/settings without touching code."""
    rows = {s.key: s.value for s in Setting.query.all()}
    merged = dict(Setting.DEFAULTS)
    merged.update({k: v for k, v in rows.items() if v is not None})
    merged["whatsapp_number"] = merged.get("whatsapp") or current_app.config.get("WHATSAPP_NUMBER")
    return success({"settings": merged})
