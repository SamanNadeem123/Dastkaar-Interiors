from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class RegisterSchema(Schema):
    full_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    email = fields.Email(required=True)
    phone = fields.String(required=True, validate=validate.Length(min=7, max=30))
    password = fields.String(required=True, validate=validate.Length(min=6, max=128))
    confirm_password = fields.String(required=True)

    @validates_schema
    def validate_passwords(self, data, **kwargs):
        if data.get("password") != data.get("confirm_password"):
            raise ValidationError("Passwords do not match.", field_name="confirm_password")


class AdminSignupSchema(RegisterSchema):
    admin_signup_key = fields.String(required=True)


class LoginSchema(Schema):
    identifier = fields.String(required=True)  # email or phone
    password = fields.String(required=True)
    remember_me = fields.Boolean(load_default=False)


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordSchema(Schema):
    token = fields.String(required=True)
    new_password = fields.String(required=True, validate=validate.Length(min=6, max=128))
