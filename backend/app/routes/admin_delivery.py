from flask import Blueprint, request
from app.extensions import db
from app.models.misc import DeliveryZone
from app.schemas.misc_schemas import DeliveryZoneSchema
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.middleware.auth import admin_required

admin_delivery_bp = Blueprint("admin_delivery", __name__, url_prefix="/api/admin/delivery/zones")


@admin_delivery_bp.get("")
@admin_required
def list_zones():
    zones = DeliveryZone.query.order_by(DeliveryZone.city_name.asc()).all()
    return success({"items": [z.to_dict() for z in zones]})


@admin_delivery_bp.post("")
@admin_required
def create_zone():
    data, errors = validate_payload(DeliveryZoneSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    if DeliveryZone.query.filter(db.func.lower(DeliveryZone.city_name) == data["city_name"].lower()).first():
        return error("A delivery zone for this city already exists.", {"city_name": ["Already exists"]}, 409)

    zone = DeliveryZone(city_name=data["city_name"], fee=data["fee"], is_active=data.get("is_active", True))
    db.session.add(zone)
    db.session.commit()
    return success({"zone": zone.to_dict()}, "Delivery zone created successfully", 201)


@admin_delivery_bp.put("/<int:zone_id>")
@admin_required
def update_zone(zone_id):
    zone = db.session.get(DeliveryZone, zone_id)
    if not zone:
        return error("Delivery zone not found.", status_code=404)

    data, errors = validate_payload(DeliveryZoneSchema(partial=True), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    # NOTE: existing orders store their own delivery_charge snapshot at the
    # time of purchase, so changing a zone's fee here never alters historical orders.
    for field in ("city_name", "fee", "is_active"):
        if field in data:
            setattr(zone, field, data[field])

    db.session.commit()
    return success({"zone": zone.to_dict()}, "Delivery zone updated successfully")


@admin_delivery_bp.delete("/<int:zone_id>")
@admin_required
def delete_zone(zone_id):
    zone = db.session.get(DeliveryZone, zone_id)
    if not zone:
        return error("Delivery zone not found.", status_code=404)
    db.session.delete(zone)
    db.session.commit()
    return success(message="Delivery zone deleted successfully")
