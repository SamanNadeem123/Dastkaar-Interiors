import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(basedir, ".env"))


def _bool(val, default=False):
    if val is None:
        return default
    return str(val).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/na_furniture_valley"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 30))
    )
    JWT_TOKEN_LOCATION = ["headers"]

    DEBUG = _bool(os.environ.get("DEBUG"), True)
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

    MAIL_SERVER = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = _bool(os.environ.get("MAIL_USE_TLS"), True)
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "noreply@nafurniturevalley.com")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@nafurniturevalley.com")

    ADMIN_SIGNUP_ENABLED = _bool(os.environ.get("ADMIN_SIGNUP_ENABLED"), True)
    ADMIN_SIGNUP_KEY = os.environ.get("ADMIN_SIGNUP_KEY", "change-this-secret")

    WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "923000000000")

    PAYMENT_PROVIDER = os.environ.get("PAYMENT_PROVIDER", "sandbox")
    PAYMENT_PUBLIC_KEY = os.environ.get("PAYMENT_PUBLIC_KEY", "")
    PAYMENT_SECRET_KEY = os.environ.get("PAYMENT_SECRET_KEY", "")
    PAYMENT_WEBHOOK_SECRET = os.environ.get("PAYMENT_WEBHOOK_SECRET", "")

    DEFAULT_DELIVERY_CHARGE = float(os.environ.get("DEFAULT_DELIVERY_CHARGE", 3000))
    CURRENCY = os.environ.get("CURRENCY", "PKR")

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB upload limit
    UPLOAD_FOLDER = os.path.join(basedir, "static", "uploads")
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


class TestingConfig(Config):
    TESTING = True
    # Uses a real PostgreSQL test database (not SQLite) by default, so the
    # test suite exercises the same dialect-specific behavior as production
    # (e.g. SELECT ... FOR UPDATE row locking, ILIKE, NUMERIC precision).
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/na_furniture_valley_test",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)
    ADMIN_SIGNUP_ENABLED = True
    ADMIN_SIGNUP_KEY = "test-signup-key"
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False
