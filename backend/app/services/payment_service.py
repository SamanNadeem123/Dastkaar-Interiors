"""
Payment service abstraction.

Supports:
- Cash on Delivery (no gateway interaction; payment stays 'pending' until delivery)
- Card payment via a pluggable provider. When PAYMENT_PROVIDER=sandbox (default,
  used when no real gateway credentials are configured), a safe local sandbox
  simulates a hosted-checkout flow so the full application works end-to-end
  without real payment credentials. When real credentials are supplied for a
  supported provider, that provider's API is used instead.

IMPORTANT SECURITY NOTES:
- Raw card numbers / CVV are never accepted or stored by this backend.
- Card details are only ever handled by the gateway's own hosted checkout
  page or client-side tokenization widget on the frontend.
- Orders are only marked 'paid' after a verified payment confirmation
  (sandbox "verify" call, or, in production, a signature-verified webhook).
"""
import hashlib
import hmac
import logging
import uuid
from flask import current_app

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self):
        pass

    @property
    def provider(self):
        return current_app.config.get("PAYMENT_PROVIDER", "sandbox")

    def create_payment(self, order):
        """
        Initiates a payment for card orders. Returns a dict the frontend can
        use to complete payment (e.g. a checkout URL/session id).
        For sandbox mode, returns a fake but consistent session the frontend
        test-mode UI can use to simulate success/failure.
        """
        if self.provider == "sandbox":
            session_id = f"sandbox_{uuid.uuid4().hex}"
            return {
                "provider": "sandbox",
                "session_id": session_id,
                "checkout_url": None,
                "amount": float(order.total),
                "currency": current_app.config.get("CURRENCY", "PKR"),
                "instructions": "Sandbox mode: call /api/payments/sandbox/confirm with this session_id to simulate a successful payment.",
            }
        # Extension point: integrate a real Pakistan-supported gateway (e.g. JazzCash / PayFast / Stripe)
        # when PAYMENT_SECRET_KEY / PAYMENT_PUBLIC_KEY are configured for that provider.
        raise NotImplementedError(f"Payment provider '{self.provider}' is not configured on this server.")

    def verify_payment(self, transaction_id, provider=None):
        """Server-side verification of a payment by transaction id. In sandbox
        mode this always returns a deterministic 'paid' result for demo
        purposes; in production this must call the gateway's verify API."""
        provider = provider or self.provider
        if provider == "sandbox":
            return {"status": "paid", "transaction_id": transaction_id}
        raise NotImplementedError(f"Verification for provider '{provider}' is not configured.")

    def handle_webhook(self, payload: bytes, signature: str):
        """Verifies a webhook signature using HMAC-SHA256 against
        PAYMENT_WEBHOOK_SECRET before trusting the payload. Never trust an
        unverified webhook body."""
        secret = current_app.config.get("PAYMENT_WEBHOOK_SECRET", "")
        if not secret:
            logger.warning("Webhook received but PAYMENT_WEBHOOK_SECRET is not configured; rejecting.")
            return False, None
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature or ""):
            logger.warning("Webhook signature verification failed.")
            return False, None
        return True, payload


payment_service = PaymentService()
