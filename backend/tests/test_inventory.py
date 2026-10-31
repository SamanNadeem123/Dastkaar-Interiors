def test_cannot_order_more_than_available_stock(client, product):
    r = client.post("/api/orders", json={
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street", "city": "Lahore",
        "payment_method": "cod",
        "items": [{"product_id": product["id"], "quantity": product["stock_quantity"] + 1, "selected_color": "Walnut"}],
    })
    assert r.status_code == 400


def test_made_to_order_product_bypasses_stock_limit(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "Custom Made Sofa", "category_id": category["id"],
        "original_price": 100000, "stock_quantity": 0, "availability": "made_to_order",
    }, headers=admin_headers)
    made_to_order_product = r.get_json()["data"]["product"]

    r2 = client.post("/api/orders", json={
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street", "city": "Lahore",
        "payment_method": "cod",
        "items": [{"product_id": made_to_order_product["id"], "quantity": 5}],
    })
    assert r2.status_code == 201


def test_stock_decreases_exactly_by_ordered_quantity(client, product):
    client.post("/api/orders", json={
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street", "city": "Lahore",
        "payment_method": "cod",
        "items": [{"product_id": product["id"], "quantity": 4, "selected_color": "Walnut"}],
    })
    r = client.get(f"/api/products/{product['slug']}")
    assert r.get_json()["data"]["product"]["stock_quantity"] == product["stock_quantity"] - 4


def test_stock_reaching_zero_marks_out_of_stock(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "Last Unit Chair", "category_id": category["id"],
        "original_price": 20000, "stock_quantity": 1, "availability": "in_stock",
    }, headers=admin_headers)
    p = r.get_json()["data"]["product"]

    client.post("/api/orders", json={
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street", "city": "Lahore",
        "payment_method": "cod", "items": [{"product_id": p["id"], "quantity": 1}],
    })
    r2 = client.get(f"/api/products/{p['slug']}")
    body = r2.get_json()["data"]["product"]
    assert body["stock_quantity"] == 0
    assert body["availability"] == "out_of_stock"


def test_cancelling_order_restores_stock_and_availability(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "Restockable Chair", "category_id": category["id"],
        "original_price": 20000, "stock_quantity": 1, "availability": "in_stock",
    }, headers=admin_headers)
    p = r.get_json()["data"]["product"]

    r2 = client.post("/api/orders", json={
        "customer_name": "Test Customer", "customer_phone": "923011111", "address": "123 Test Street", "city": "Lahore",
        "payment_method": "cod", "items": [{"product_id": p["id"], "quantity": 1}],
    })
    order = r2.get_json()["data"]["order"]

    orders = client.get("/api/admin/orders", headers=admin_headers).get_json()["data"]["items"]
    order_id = next(o["id"] for o in orders if o["order_number"] == order["order_number"])
    client.patch(f"/api/admin/orders/{order_id}/status", json={"order_status": "cancelled"}, headers=admin_headers)

    r3 = client.get(f"/api/products/{p['slug']}")
    body = r3.get_json()["data"]["product"]
    assert body["stock_quantity"] == 1
    assert body["availability"] == "in_stock"
