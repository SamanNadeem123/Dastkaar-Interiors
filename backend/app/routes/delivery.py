from flask import Blueprint, request
from app.models.misc import DeliveryZone
from app.utils.responses import success
from app.services.order_service import get_delivery_charge

delivery_bp = Blueprint("delivery", __name__, url_prefix="/api/delivery")


@delivery_bp.get("/zones")
def list_zones():
    zones = DeliveryZone.query.filter_by(is_active=True).order_by(DeliveryZone.city_name.asc()).all()
    return success({"items": [z.to_dict() for z in zones]})


@delivery_bp.get("/quote")
def quote():
    """Returns the delivery charge for a given city so it can be shown to the
    customer BEFORE they place the order. This is a preview only - the
    backend recomputes the charge again at order-creation time."""
    city = request.args.get("city", "")
    fee = get_delivery_charge(city)
    return success({"city": city, "delivery_charge": fee})
