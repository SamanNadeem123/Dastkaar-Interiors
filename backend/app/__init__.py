import os
import logging
from flask import Flask
from app.config import Config, TestingConfig, basedir
from app.extensions import db, migrate, jwt, cors, mail, socketio, limiter


def create_app(config_object=None):
    # static_folder is explicitly pointed at <backend>/static (matching
    # UPLOAD_FOLDER in config.py) rather than Flask's package-relative
    # default of <backend>/app/static, so images saved by the local-disk
    # upload fallback (used when Cloudinary isn't configured) are actually
    # served at the /static/uploads/... URL the app returns for them.
    app = Flask(__name__, static_folder=os.path.join(basedir, "static"), static_url_path="/static")
    app.config.from_object(config_object or Config)

    logging.basicConfig(
        level=logging.INFO if not app.config.get("DEBUG") else logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # ---- Extensions ----
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config.get("FRONTEND_ORIGIN", "*")}},
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins=app.config.get("FRONTEND_ORIGIN", "*"))

    # ---- Models (ensure they're registered with SQLAlchemy metadata) ----
    from app import models  # noqa: F401

    # ---- JWT error handlers (consistent API response shape) ----
    from app.utils.responses import error

    @jwt.unauthorized_loader
    def _missing_token(reason):
        return error("Authentication required.", status_code=401)

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return error("Invalid authentication token.", status_code=401)

    @jwt.expired_token_loader
    def _expired_token(header, payload):
        return error("Session expired. Please log in again.", status_code=401)

    @jwt.revoked_token_loader
    def _revoked_token(header, payload):
        return error("This token has been revoked.", status_code=401)

    # ---- Blueprints ----
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.categories import categories_bp
    from app.routes.cart import cart_bp
    from app.routes.orders import orders_bp
    from app.routes.delivery import delivery_bp
    from app.routes.reviews import reviews_bp
    from app.routes.gallery import gallery_bp
    from app.routes.settings import settings_bp
    from app.routes.payments import payments_bp
    from app.routes.health import health_bp
    from app.routes.admin_products import admin_products_bp
    from app.routes.admin_categories import admin_categories_bp
    from app.routes.admin_orders import admin_orders_bp
    from app.routes.admin_customers import admin_customers_bp
    from app.routes.admin_delivery import admin_delivery_bp
    from app.routes.admin_reviews import admin_reviews_bp
    from app.routes.admin_gallery import admin_gallery_bp
    from app.routes.admin_settings import admin_settings_bp
    from app.routes.admin_dashboard import admin_dashboard_bp
    from app.routes.admin_notifications import admin_notifications_bp

    for bp in (
        auth_bp, products_bp, categories_bp, cart_bp, orders_bp, delivery_bp,
        reviews_bp, gallery_bp, settings_bp, payments_bp, health_bp,
        admin_products_bp, admin_categories_bp, admin_orders_bp, admin_customers_bp,
        admin_delivery_bp, admin_reviews_bp, admin_gallery_bp, admin_settings_bp,
        admin_dashboard_bp, admin_notifications_bp,
    ):
        app.register_blueprint(bp)

    # ---- Error handlers ----
    from app.middleware.error_handlers import register_error_handlers
    register_error_handlers(app)

    # ---- Socket.IO auth: only verified admins may join the admin notification room ----
    from app.sockets import register_socket_handlers
    register_socket_handlers(socketio)

    return app
