from marshmallow import Schema, fields, validate, EXCLUDE

PAYMENT_METHODS = ("cod", "card")


class CartItemAddSchema(Schema):
    product_id = fields.Integer(required=True)
    quantity = fields.Integer(required=False, load_default=1, validate=validate.Range(min=1, max=50))
    selected_color = fields.String(required=False, allow_none=True)


class CartItemUpdateSchema(Schema):
    quantity = fields.Integer(required=True, validate=validate.Range(min=1, max=50))


class AddressSchema(Schema):
    full_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    phone = fields.String(required=True, validate=validate.Length(min=7, max=30))
    address_line = fields.String(required=True, validate=validate.Length(min=5, max=300))
    city = fields.String(required=True, validate=validate.Length(min=2, max=100))
    postal_code = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    is_default = fields.Boolean(load_default=True)


class OrderItemInputSchema(Schema):
    product_id = fields.Integer(required=True)
    quantity = fields.Integer(required=True, validate=validate.Range(min=1, max=50))
    selected_color = fields.String(required=False, allow_none=True)


class OrderCreateSchema(Schema):
    class Meta:
        # Silently ignore any extra/unrecognized fields (e.g. a client-side
        # "total" or "subtotal" a frontend might send for its own display
        # purposes) rather than hard-rejecting the whole request. The backend
        # never reads price/total from the request body regardless - only
        # fields explicitly declared below are ever used to compute the order.
        unknown = EXCLUDE

    customer_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    customer_email = fields.Email(required=False, allow_none=True)
    customer_phone = fields.String(required=True, validate=validate.Length(min=7, max=30))
    address = fields.String(required=True, validate=validate.Length(min=5, max=300))
    city = fields.String(required=True, validate=validate.Length(min=2, max=100))
    postal_code = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))
    payment_method = fields.String(required=True, validate=validate.OneOf(PAYMENT_METHODS))
    items = fields.List(fields.Nested(OrderItemInputSchema), required=True, validate=validate.Length(min=1))
    idempotency_key = fields.String(required=False, allow_none=True)
    save_address = fields.Boolean(load_default=False)


class DeliveryZoneSchema(Schema):
    city_name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    fee = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))
    is_active = fields.Boolean(load_default=True)


class ReviewCreateSchema(Schema):
    product_id = fields.Integer(required=False, allow_none=True)
    customer_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    rating = fields.Integer(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    image_url = fields.String(required=False, allow_none=True)


class GalleryImageSchema(Schema):
    title = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    category = fields.String(required=False, allow_none=True, validate=validate.Length(max=80))
    is_active = fields.Boolean(load_default=True)
    sort_order = fields.Integer(load_default=0)


class SettingsUpdateSchema(Schema):
    class Meta:
        unknown = "exclude"
    store_name = fields.String(required=False)
    logo_url = fields.String(required=False, allow_none=True)
    phone = fields.String(required=False)
    email = fields.Email(required=False)
    whatsapp = fields.String(required=False)
    address = fields.String(required=False)
    opening_hours = fields.String(required=False)
    facebook_url = fields.String(required=False, allow_none=True)
    instagram_url = fields.String(required=False, allow_none=True)
    currency = fields.String(required=False)
    default_delivery_charge = fields.String(required=False)
    admin_notification_email = fields.Email(required=False)
