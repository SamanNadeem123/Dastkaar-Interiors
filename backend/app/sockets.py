"""
Socket.IO handlers.

Security requirement: only authenticated admins may join the admin
notification room. A normal customer connecting to the socket must never
receive admin "new order" events. We verify the JWT access token passed by
the client during the connection handshake (auth payload or query string)
before allowing the join - we never trust a client-asserted role.
"""
import logging
from flask_socketio import join_room, emit, disconnect
from flask_jwt_extended import decode_token

logger = logging.getLogger(__name__)

ADMIN_ROOM = "admin_room"


def _extract_token(auth, request):
    if isinstance(auth, dict) and auth.get("token"):
        return auth["token"]
    return request.args.get("token")


def register_socket_handlers(socketio):
    from flask import request

    @socketio.on("connect", namespace="/")
    def handle_connect(auth=None):
        # Anonymous connections are allowed (e.g. a customer tracking a public
        # order number room), but they are never placed in the admin room.
        logger.debug("Socket client connected: %s", request.sid)

    @socketio.on("join_admin_room")
    def handle_join_admin(data):
        token = _extract_token(data, request)
        if not token:
            emit("error", {"message": "Authentication required."})
            disconnect()
            return
        try:
            decoded = decode_token(token)
        except Exception:
            emit("error", {"message": "Invalid or expired token."})
            disconnect()
            return

        role = decoded.get("role")
        if role != "admin":
            logger.warning("Non-admin attempted to join admin notification room.")
            emit("error", {"message": "Admin access required."})
            disconnect()
            return

        join_room(ADMIN_ROOM)
        emit("joined_admin_room", {"success": True})

    @socketio.on("track_order")
    def handle_track_order(data):
        """Lets a customer join a room scoped to their own order number so
        they can receive live status updates - no admin data is exposed here."""
        order_number = (data or {}).get("order_number")
        if order_number:
            join_room(f"order_{order_number}")
            emit("tracking_started", {"order_number": order_number})

    @socketio.on("disconnect")
    def handle_disconnect():
        logger.debug("Socket client disconnected: %s", request.sid)
