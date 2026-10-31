def _order_payload(product, quantity=1, color="Walnut", payment_method="cod", **overrides):
    payload = {
        "customer_name": "Test Customer", "customer_phone": "923011111",
        "customer_email": "buyer@test.com", "address": "123 Test Street",
        "city": "Lahore", "postal_code": "54000", "payment_method": payment_method,
        "items": [{"product_id": product["id"], "quantity": quantity, "selected_color": color}],
    }
    payload.update(overrides)
    return payload


def test_guest_can_place_order(client, product):
    r = client.post("/api/orders", json=_order_payload(product))
    assert r.status_code == 201
    order = r.get_json()["data"]["order"]
    assert order["order_number"].startswith("ORD-")
    assert order["user_id"] is None


def test_authenticated_customer_order_linked_to_account(client, customer_headers, product):
    r = client.post("/api/orders", json=_order_payload(product), headers=customer_headers)
    order = r.get_json()["data"]["order"]
    assert order["user_id"] is not None


def test_order_total_calculated_by_backend_not_trusted_from_client(client, product):
    payload = _order_payload(product, quantity=2)
    payload["total"] = 1  # attacker-supplied fake total - must be ignored
    payload["subtotal"] = 1
    r = client.post("/api/orders", json=payload)
    order = r.get_json()["data"]["order"]
    # subtotal is based on original_price (100000 * 2 = 200000), discount is
    # the separate (original - sale) * qty = 40000, matching the spec's
    # "Subtotal / Discount / Delivery / Total" breakdown - never the spoofed values.
    assert order["subtotal"] == 200000.0
    assert order["discount"] == 40000.0
    assert order["total"] != 1
    assert order["total"] == 200000.0 - 40000.0 + order["delivery_charge"]


def test_cod_order_payment_status_is_pending(client, product):
    r = client.post("/api/orders", json=_order_payload(product, payment_method="cod"))
    order = r.get_json()["data"]["order"]
    assert order["payment_method"] == "cod"
    assert order["payment_status"] == "pending"
    assert order["order_status"] == "pending"


def test_order_rejects_invalid_color(client, product):
    r = client.post("/api/orders", json=_order_payload(product, color="NotAColor"))
    assert r.status_code == 400


def test_order_rejects_quantity_exceeding_stock(client, product):
    r = client.post("/api/orders", json=_order_payload(product, quantity=product["stock_quantity"] + 5))
    assert r.status_code == 400


def test_order_creation_deducts_inventory(client, product):
    before = product["stock_quantity"]
    client.post("/api/orders", json=_order_payload(product, quantity=3))
    r = client.get(f"/api/products/{product['slug']}")
    after = r.get_json()["data"]["product"]["stock_quantity"]
    assert after == before - 3


def test_duplicate_order_idempotency_key_returns_same_order(client, product):
    payload = _order_payload(product)
    payload["idempotency_key"] = "abc-123"
    r1 = client.post("/api/orders", json=payload)
    r2 = client.post("/api/orders", json=payload)
    assert r1.get_json()["data"]["order"]["order_number"] == r2.get_json()["data"]["order"]["order_number"]

    # Stock should only be deducted once, not twice.
    r = client.get(f"/api/products/{product['slug']}")
    assert r.get_json()["data"]["product"]["stock_quantity"] == product["stock_quantity"] - 1


def test_guest_can_view_order_by_order_number(client, product):
    r = client.post("/api/orders", json=_order_payload(product))
    order_number = r.get_json()["data"]["order"]["order_number"]
    r2 = client.get(f"/api/orders/{order_number}")
    assert r2.status_code == 200


def test_customer_cannot_view_others_authenticated_order(client, customer_headers, product):
    r = client.post("/api/orders", json=_order_payload(product), headers=customer_headers)
    order_number = r.get_json()["data"]["order"]["order_number"]

    client.post("/api/auth/register", json={
        "full_name": "Other", "email": "other2@test.com", "phone": "923010000078",
        "password": "OtherPass123!", "confirm_password": "OtherPass123!",
    })
    r2 = client.post("/api/auth/login", json={"identifier": "other2@test.com", "password": "OtherPass123!"})
    other_headers = {"Authorization": f"Bearer {r2.get_json()['data']['access_token']}"}

    r3 = client.get(f"/api/orders/{order_number}", headers=other_headers)
    assert r3.status_code == 403


def test_admin_can_update_order_status(client, admin_headers, product):
    r = client.post("/api/orders", json=_order_payload(product))
    order_number = r.get_json()["data"]["order"]["order_number"]

    orders = client.get("/api/admin/orders", headers=admin_headers).get_json()["data"]["items"]
    order_id = next(o["id"] for o in orders if o["order_number"] == order_number)

    r2 = client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "confirmed"}, headers=admin_headers)
    assert r2.status_code == 200
    assert r2.get_json()["data"]["order"]["order_status"] == "confirmed"


def test_order_status_update_requires_admin(client, customer_headers, product):
    r = client.post("/api/orders", json=_order_payload(product), headers=customer_headers)
    order_number = r.get_json()["data"]["order"]["order_number"]
    order_id = r.get_json()["data"]["order"]["id"]

    r2 = client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "confirmed"}, headers=customer_headers)
    assert r2.status_code == 403


def test_terminal_order_status_cannot_be_changed_again(client, admin_headers, product):
    r = client.post("/api/orders", json=_order_payload(product))
    order = r.get_json()["data"]["order"]
    orders = client.get("/api/admin/orders", headers=admin_headers).get_json()["data"]["items"]
    order_id = next(o["id"] for o in orders if o["order_number"] == order["order_number"])

    r2 = client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "cancelled"}, headers=admin_headers)
    assert r2.status_code == 200

    # Order is now terminal (cancelled) - further changes must be rejected.
    r3 = client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "confirmed"}, headers=admin_headers)
    assert r3.status_code == 400


def test_cancelling_order_restores_stock(client, admin_headers, product):
    before = product["stock_quantity"]
    r = client.post("/api/orders", json=_order_payload(product, quantity=2))
    order = r.get_json()["data"]["order"]
    orders = client.get("/api/admin/orders", headers=admin_headers).get_json()["data"]["items"]
    order_id = next(o["id"] for o in orders if o["order_number"] == order["order_number"])

    client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "cancelled"}, headers=admin_headers)

    r2 = client.get(f"/api/products/{product['slug']}")
    assert r2.get_json()["data"]["product"]["stock_quantity"] == before


def test_card_payment_creates_pending_payment_record(client, admin_headers, product):
    r = client.post("/api/orders", json=_order_payload(product, payment_method="card"))
    order = r.get_json()["data"]["order"]
    assert order["payment_method"] == "card"
    assert order["payment_status"] == "pending"

    orders = client.get("/api/admin/orders", headers=admin_headers).get_json()["data"]["items"]
    order_id = next(o["id"] for o in orders if o["order_number"] == order["order_number"])
    detail = client.get(f"/api/admin/orders/{order_id}", headers=admin_headers).get_json()["data"]["order"]
    assert len(detail["payments"]) == 1
    assert detail["payments"][0]["status"] == "pending"


def test_sandbox_payment_confirmation_marks_order_paid(client, product):
    r = client.post("/api/orders", json=_order_payload(product, payment_method="card"))
    order_number = r.get_json()["data"]["order"]["order_number"]

    r2 = client.post("/api/payments/sandbox/confirm", json={"order_number": order_number, "simulate": "success"})
    assert r2.status_code == 200
    assert r2.get_json()["data"]["order"]["payment_status"] == "paid"
