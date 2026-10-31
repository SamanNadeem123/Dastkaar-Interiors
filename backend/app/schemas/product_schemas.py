from marshmallow import Schema, fields, validate

AVAILABILITY = ("in_stock", "out_of_stock", "made_to_order", "coming_soon")
DIMENSION_UNITS = ("in", "ft", "cm", "kg")


class ColorInputSchema(Schema):
    color_name = fields.String(required=True, validate=validate.Length(min=1, max=60))
    color_code = fields.String(required=False, allow_none=True, validate=validate.Length(max=20))


class ProductCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    category_id = fields.Integer(required=True)
    sku = fields.String(required=False, allow_none=True, validate=validate.Length(max=60))
    short_description = fields.String(required=False, allow_none=True, validate=validate.Length(max=300))
    description = fields.String(required=False, allow_none=True)

    original_price = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0.01))
    sale_price = fields.Decimal(required=False, allow_none=True, as_string=False, validate=validate.Range(min=0))

    material = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))
    wood_type = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))

    width = fields.Decimal(required=False, allow_none=True, as_string=False)
    height = fields.Decimal(required=False, allow_none=True, as_string=False)
    depth = fields.Decimal(required=False, allow_none=True, as_string=False)
    length = fields.Decimal(required=False, allow_none=True, as_string=False)
    weight = fields.Decimal(required=False, allow_none=True, as_string=False)
    dimension_unit = fields.String(required=False, load_default="in", validate=validate.OneOf(DIMENSION_UNITS))

    availability = fields.String(required=False, load_default="in_stock", validate=validate.OneOf(AVAILABILITY))
    stock_quantity = fields.Integer(required=False, load_default=0, validate=validate.Range(min=0))

    is_featured = fields.Boolean(load_default=False)
    is_new = fields.Boolean(load_default=False)
    is_on_sale = fields.Boolean(load_default=False)
    is_active = fields.Boolean(load_default=True)

    colors = fields.List(fields.Nested(ColorInputSchema), required=False, load_default=list)


class ProductUpdateSchema(ProductCreateSchema):
    name = fields.String(required=False, validate=validate.Length(min=2, max=200))
    category_id = fields.Integer(required=False)
    original_price = fields.Decimal(required=False, as_string=False, validate=validate.Range(min=0.01))


class CategorySchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    description = fields.String(required=False, allow_none=True)
    image_url = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(load_default=True)
    sort_order = fields.Integer(load_default=0)
