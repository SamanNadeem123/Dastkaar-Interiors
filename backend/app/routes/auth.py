import logging
import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt,
)
from app.extensions import db, limiter
from app.models.user import User
from app.schemas.auth_schemas import (
    RegisterSchema, AdminSignupSchema, LoginSchema,
    ForgotPasswordSchema, ResetPasswordSchema,
)
from app.utils.schema_helper import validate_payload
from app.utils.responses import success, error
from app.middleware.auth import jwt_required_custom
from app.services import email_service

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# In-memory password reset token store (dev-friendly; swap for a DB table/Redis in production)
_reset_tokens = {}


def _issue_tokens(user):
    claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return access_token, refresh_token


@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data, errors = validate_payload(RegisterSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    if User.query.filter_by(email=data["email"]).first():
        return error("An account with this email already exists.", {"email": ["Already registered"]}, 409)
    if User.query.filter_by(phone=data["phone"]).first():
        return error("An account with this phone number already exists.", {"phone": ["Already registered"]}, 409)

    user = User(full_name=data["full_name"], email=data["email"], phone=data["phone"], role="customer")
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return success(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        "Account created successfully", 201,
    )


@auth_bp.post("/admin/signup")
@limiter.limit("5 per minute")
def admin_signup():
    if not current_app.config.get("ADMIN_SIGNUP_ENABLED"):
        return error("Admin signup is currently disabled.", status_code=403)

    data, errors = validate_payload(AdminSignupSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    if data["admin_signup_key"] != current_app.config.get("ADMIN_SIGNUP_KEY"):
        return error("Invalid admin signup key.", status_code=403)

    if User.query.filter_by(email=data["email"]).first():
        return error("An account with this email already exists.", {"email": ["Already registered"]}, 409)
    if User.query.filter_by(phone=data["phone"]).first():
        return error("An account with this phone number already exists.", {"phone": ["Already registered"]}, 409)

    user = User(full_name=data["full_name"], email=data["email"], phone=data["phone"], role="admin")
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return success(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        "Admin account created successfully", 201,
    )


@auth_bp.post("/login")
@limiter.limit("15 per minute")
def login():
    data, errors = validate_payload(LoginSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    identifier = data["identifier"].strip()
    user = User.query.filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not user.check_password(data["password"]):
        return error("Invalid credentials.", status_code=401)
    if not user.is_active:
        return error("This account has been deactivated.", status_code=403)

    access_token, refresh_token = _issue_tokens(user)
    return success(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        "Login successful",
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user or not user.is_active:
        return error("Account not found or inactive.", status_code=401)
    claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    return success({"access_token": access_token}, "Token refreshed")


@auth_bp.post("/logout")
@jwt_required_custom
def logout():
    # Stateless JWT: logout is handled client-side by discarding tokens.
    return success(message="Logged out successfully")


@auth_bp.get("/me")
@jwt_required_custom
def me():
    from flask import g
    return success({"user": g.current_user.to_dict()})


@auth_bp.post("/forgot-password")
@limiter.limit("5 per minute")
def forgot_password():
    data, errors = validate_payload(ForgotPasswordSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    user = User.query.filter_by(email=data["email"]).first()
    # Always respond the same way whether or not the account exists, to avoid leaking
    # which emails are registered.
    if user:
        token = secrets.token_urlsafe(32)
        _reset_tokens[token] = {"user_id": user.id, "expires": datetime.now(timezone.utc) + timedelta(hours=1)}
        try:
            email_service.send_password_reset(user, token)
        except Exception as e:
            logger.error("Password reset email failed: %s", e)

    return success(message="If an account with that email exists, a reset link has been sent.")


@auth_bp.post("/reset-password")
@limiter.limit("10 per minute")
def reset_password():
    data, errors = validate_payload(ResetPasswordSchema(), request.get_json(silent=True))
    if errors:
        return error("Validation failed", errors, 422)

    record = _reset_tokens.get(data["token"])
    if not record or record["expires"] < datetime.now(timezone.utc):
        return error("This reset link is invalid or has expired.", status_code=400)

    user = db.session.get(User, record["user_id"])
    if not user:
        return error("Account not found.", status_code=404)

    user.set_password(data["new_password"])
    db.session.commit()
    del _reset_tokens[data["token"]]
    return success(message="Password has been reset successfully.")
