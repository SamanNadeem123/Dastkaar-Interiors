"""
Email service. Sends real emails via SMTP when configured (MAIL_SERVER set).
If not configured, safely logs and no-ops so the rest of the application
(order creation, etc.) is never broken by email failures.
"""
import logging
from flask import current_app
from app.extensions import mail
from flask_mail import Message

logger = logging.getLogger(__name__)


def _mail_configured():
    return bool(current_app.config.get("MAIL_SERVER"))


def _send(subject, recipients, html_body):
    if not _mail_configured():
        logger.info("[email-service] SMTP not configured. Skipping email '%s' to %s", subject, recipients)
        return False
    try:
        msg = Message(subject=subject, recipients=recipients, html=html_body,
                      sender=current_app.config["MAIL_DEFAULT_SENDER"])
        mail.send(msg)
        return True
    except Exception as e:
        logger.error("[email-service] Failed to send email '%s' to %s: %s", subject, recipients, e)
        return False


def _brand_wrapper(inner_html):
    return f"""
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#faf6f0;padding:32px;">
      <h1 style="color:#3b2a1e;letter-spacing:2px;font-size:22px;text-transform:uppercase;">NA FURNITURE VALLEY</h1>
      <div style="height:2px;background:#c9a876;margin:12px 0 24px;"></div>
      {inner_html}
      <p style="margin-top:32px;color:#8a7968;font-size:13px;">NA FURNITURE VALLEY &mdash; Furniture Crafted for Modern Living</p>
    </div>
    """


def send_order_confirmation(order):
    if not order.customer_email:
        return
    items_html = "".join(
        f"<tr><td style='padding:6px 0;'>{i.product_name_snapshot} x{i.quantity}"
        f"{' (' + i.selected_color + ')' if i.selected_color else ''}</td>"
        f"<td style='text-align:right;'>PKR {i.line_total:,.0f}</td></tr>"
        for i in order.items
    )
    inner = f"""
    <p>Hi {order.customer_name},</p>
    <p>Thank you for your order! Here are your order details:</p>
    <p><strong>Order Number:</strong> {order.order_number}</p>
    <table style="width:100%;border-collapse:collapse;">{items_html}</table>
    <hr/>
    <p>Subtotal: PKR {float(order.subtotal):,.0f}<br/>
    Discount: PKR {float(order.discount):,.0f}<br/>
    Delivery: PKR {float(order.delivery_charge):,.0f}<br/>
    <strong>Total: PKR {float(order.total):,.0f}</strong></p>
    <p>Payment Method: {order.payment_method.upper()}<br/>
    Order Status: {order.order_status.title()}</p>
    """
    _send(f"Order Confirmation - {order.order_number}", [order.customer_email], _brand_wrapper(inner))


def send_admin_new_order_notification(order, admin_email):
    inner = f"""
    <p>A new order has been received.</p>
    <p><strong>Order Number:</strong> {order.order_number}<br/>
    <strong>Customer:</strong> {order.customer_name}<br/>
    <strong>Phone:</strong> {order.customer_phone}<br/>
    <strong>City:</strong> {order.city}<br/>
    <strong>Total:</strong> PKR {float(order.total):,.0f}<br/>
    <strong>Payment Method:</strong> {order.payment_method.upper()}<br/>
    <strong>Order Status:</strong> {order.order_status.title()}</p>
    """
    _send(f"New Order Received - {order.order_number}", [admin_email], _brand_wrapper(inner))


def send_order_status_update(order):
    if not order.customer_email:
        return
    inner = f"""
    <p>Hi {order.customer_name},</p>
    <p>Your order <strong>{order.order_number}</strong> status has been updated to:</p>
    <h2 style="color:#3b2a1e;">{order.order_status.title()}</h2>
    """
    _send(f"Order Update - {order.order_number}", [order.customer_email], _brand_wrapper(inner))


def send_password_reset(user, reset_token):
    inner = f"""
    <p>Hi {user.full_name},</p>
    <p>Use the token below to reset your password. This token is valid for a limited time.</p>
    <p style="font-family:monospace;background:#eee;padding:8px;">{reset_token}</p>
    """
    _send("Password Reset - NA FURNITURE VALLEY", [user.email], _brand_wrapper(inner))
