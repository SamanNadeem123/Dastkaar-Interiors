import logging
from flask import current_app
from werkzeug.exceptions import HTTPException
from app.utils.responses import error

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return error("Bad request.", status_code=400)

    @app.errorhandler(401)
    def unauthorized(e):
        return error("Authentication required.", status_code=401)

    @app.errorhandler(403)
    def forbidden(e):
        return error("You do not have permission to perform this action.", status_code=403)

    @app.errorhandler(404)
    def not_found(e):
        return error("The requested resource was not found.", status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error("Method not allowed.", status_code=405)

    @app.errorhandler(413)
    def payload_too_large(e):
        return error("Uploaded file is too large.", status_code=413)

    @app.errorhandler(429)
    def rate_limited(e):
        return error("Too many requests. Please slow down and try again shortly.", status_code=429)

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return error(e.description or "Request error.", status_code=e.code)

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        logger.exception("Unhandled exception: %s", e)
        # Never leak stack traces / internals to the client
        message = "An unexpected error occurred. Please try again." if not current_app.debug else str(e)
        return error(message, status_code=500)
