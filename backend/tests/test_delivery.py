def test_admin_can_create_delivery_zone(client, admin_headers):
    r = client.post("/api/admin/delivery/zones", json={"city_name": "Multan", "fee": 4500}, headers=admin_headers)
    assert r.status_code == 201
    assert r.get_json()["data"]["zone"]["fee"] == 4500.0


def test_duplicate_city_zone_rejected(client, admin_headers):
    client.post("/api/admin/delivery/zones", json={"city_name": "Multan", "fee": 4500}, headers=admin_headers)
    r = client.post("/api/admin/delivery/zones", json={"city_name": "multan", "fee": 5000}, headers=admin_headers)
    assert r.status_code == 409


def test_delivery_quote_matches_configured_zone(client, admin_headers):
    client.post("/api/admin/delivery/zones", json={"city_name": "Lahore", "fee": 2000}, headers=admin_headers)
    r = client.get("/api/delivery/quote", query_string={"city": "Lahore"})
    assert r.get_json()["data"]["delivery_charge"] == 2000.0


def test_delivery_quote_case_insensitive(client, admin_headers):
    client.post("/api/admin/delivery/zones", json={"city_name": "Lahore", "fee": 2000}, headers=admin_headers)
    r = client.get("/api/delivery/quote", query_string={"city": "lahore"})
    assert r.get_json()["data"]["delivery_charge"] == 2000.0


def test_delivery_quote_falls_back_to_default_for_unknown_city(client):
    r = client.get("/api/delivery/quote", query_string={"city": "SomewhereUnknown"})
    assert r.status_code == 200
    assert r.get_json()["data"]["delivery_charge"] is not None


def test_admin_can_deactivate_zone(client, admin_headers):
    r = client.post("/api/admin/delivery/zones", json={"city_name": "Multan", "fee": 4500}, headers=admin_headers)
    zone_id = r.get_json()["data"]["zone"]["id"]
    r2 = client.put(f"/api/admin/delivery/zones/{zone_id}", json={"is_active": False}, headers=admin_headers)
    assert r2.get_json()["data"]["zone"]["is_active"] is False

    r3 = client.get("/api/delivery/zones")
    ids = [z["id"] for z in r3.get_json()["data"]["items"]]
    assert zone_id not in ids


def test_historical_order_delivery_charge_unaffected_by_future_zone_changes(client, admin_headers, customer_headers, product):
    client.post("/api/admin/delivery/zones", json={"city_name": "Lahore", "fee": 2000}, headers=admin_headers)

    order_payload = {
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street",
        "city": "Lahore", "payment_method": "cod",
        "items": [{"product_id": product["id"], "quantity": 1, "selected_color": "Walnut"}],
    }
    r = client.post("/api/orders", json=order_payload, headers=customer_headers)
    order = r.get_json()["data"]["order"]
    assert order["delivery_charge"] == 2000.0

    zones = client.get("/api/admin/delivery/zones", headers=admin_headers).get_json()["data"]["items"]
    lahore_zone = next(z for z in zones if z["city_name"] == "Lahore")
    client.put(f"/api/admin/delivery/zones/{lahore_zone['id']}", json={"fee": 9999}, headers=admin_headers)

    r2 = client.get(f"/api/orders/{order['order_number']}", headers=customer_headers)
    assert r2.get_json()["data"]["order"]["delivery_charge"] == 2000.0
