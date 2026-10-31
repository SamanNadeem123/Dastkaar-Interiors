from marshmallow import ValidationError


def validate_payload(schema, payload):
    """Loads and validates `payload` with a marshmallow schema instance.
    Returns (data, None) on success or (None, errors_dict) on failure.
    """
    try:
        data = schema.load(payload or {})
        return data, None
    except ValidationError as err:
        return None, err.messages
