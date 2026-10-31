from flask import Blueprint
from app.utils.responses import success

health_bp = Blueprint("health", __name__, url_prefix="/api/health")


@health_bp.get("")
def health_check():
    return success(message="API is running")
