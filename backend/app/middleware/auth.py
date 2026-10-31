from functools import wraps
from flask import g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.utils.responses import error


def load_current_user():
    """Loads the current authenticated user (if any) onto flask.g.current_user."""
    identity = get_jwt_identity()
    if not identity:
        g.current_user = None
        return None
    user = db.session.get(User, int(identity))
    g.current_user = user
    return user


def jwt_required_custom(fn):
    """Requires a valid access token. Attaches the user to g.current_user."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = load_current_user()
        if not user or not user.is_active:
            return error("Account not found or inactive.", status_code=401)
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Requires a valid access token AND role == admin. Returns 403 otherwise.
    This is the backend authorization boundary - the frontend hiding admin
    links is never sufficient on its own."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user = load_current_user()
        if not user or not user.is_active:
            return error("Account not found or inactive.", status_code=401)
        if claims.get("role") != "admin" or user.role != "admin":
            return error("Admin access required.", status_code=403)
        return fn(*args, **kwargs)
    return wrapper


def optional_jwt(fn):
    """Loads current user if a token is present, but does not require one.
    Used for guest checkout / guest-browsable endpoints that behave
    differently for authenticated users."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            load_current_user()
        except Exception:
            g.current_user = None
        return fn(*args, **kwargs)
    return wrapper
