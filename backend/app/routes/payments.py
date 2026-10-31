import logging
from flask import Blueprint, request, current_app
from app.extensions import db
from app.models.order import Order, Payment
from app.utils.responses import success, error
from app.services.payment_service import payment_service
from app.services import notification_service

logger = logging.getLogger(__name__)
payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.post("/sandbox/confirm")
def sandbox_confirm():
    """
    Sandbox-only endpoint that simulates a gateway confirming a card payment,
    so the full checkout flow (including card payment) can be exercised
    end-to-end locally without real payment gateway credentials.
    This path is only active when PAYMENT_PROVIDER=sandbox.
    """
    if current_app.config.get("PAYMENT_PROVIDER", "sandbox") != "sandbox":
        return error("Sandbox confirmation is disabled when a real payment provider is configured.", status_code=403)

    payload = request.get_json(silent=True) or {}
    order_number = payload.get("order_number")
    session_id = payload.get("session_id")
    simulate = payload.get("simulate", "success")  # "success" | "failed"

    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return error("Order not found.", status_code=404)
    if order.payment_method != "card":
        return error("This order is not a card payment order.", status_code=400)

    payment = order.payments.order_by(Payment.created_at.desc()).first()
    if not payment:
        return error("No payment record found for this order.", status_code=404)

    if simulate == "success":
        result = payment_service.verify_payment(session_id or f"sandbox_{order.order_number}")
        payment.status = "paid"
        payment.transaction_id = result["transaction_id"]
        order.payment_status = "paid"
    else:
        payment.status = "failed"
        order.payment_status = "failed"

    db.session.commit()
    return success({"order": order.to_dict(detailed=True)}, "Payment status updated (sandbox mode)")


@payments_bp.post("/webhook")
def payment_webhook():
    """
    Real payment gateway webhook endpoint. The raw body and signature header
    are verified with HMAC before anything in the payload is trusted - an
    unverified webhook is never allowed to mark an order as paid.
    """
    signature = request.headers.get("X-Signature", "")
    ok, _ = payment_service.handle_webhook(request.get_data(), signature)
    if not ok:
        return error("Invalid webhook signature.", status_code=400)

    payload = request.get_json(silent=True) or {}
    transaction_id = payload.get("transaction_id")
    order_number = payload.get("order_number")
    status = payload.get("status")

    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return error("Order not found.", status_code=404)

    payment = order.payments.order_by(Payment.created_at.desc()).first()
    if payment:
        payment.transaction_id = transaction_id
        payment.status = "paid" if status == "paid" else "failed"
    order.payment_status = "paid" if status == "paid" else "failed"
    db.session.commit()

    try:
        notification_service.notify_customer_status_update(order)
    except Exception as e:
        logger.warning("Failed to notify customer after webhook: %s", e)

    return success(message="Webhook processed")
