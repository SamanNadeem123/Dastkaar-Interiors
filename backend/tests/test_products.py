def test_admin_can_create_product(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "Executive Desk", "category_id": category["id"],
        "original_price": 50000, "material": "MDF", "wood_type": "MDF",
        "stock_quantity": 5,
    }, headers=admin_headers)
    assert r.status_code == 201
    body = r.get_json()["data"]["product"]
    assert body["slug"] == "executive-desk"
    assert body["sku"].startswith("NAFV-")
    assert body["sale_price"] is None
    assert body["discount_percent"] == 0


def test_product_creation_requires_admin(client, customer_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "X", "category_id": category["id"], "original_price": 1000,
    }, headers=customer_headers)
    assert r.status_code == 403


def test_product_discount_auto_calculated(client, product):
    assert product["original_price"] == 100000.0
    assert product["sale_price"] == 80000.0
    assert product["discount_percent"] == 20.0


def test_fake_discount_never_stored_when_sale_gte_original(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "No Fake Discount", "category_id": category["id"],
        "original_price": 50000, "sale_price": 60000,
    }, headers=admin_headers)
    body = r.get_json()["data"]["product"]
    assert body["sale_price"] is None
    assert body["discount_percent"] == 0


def test_sku_uniqueness_enforced(client, admin_headers, category, product):
    r = client.post("/api/admin/products", json={
        "name": "Duplicate SKU Product", "category_id": category["id"],
        "original_price": 1000, "sku": product["sku"],
    }, headers=admin_headers)
    assert r.status_code == 409


def test_get_product_by_slug(client, product):
    r = client.get(f"/api/products/{product['slug']}")
    assert r.status_code == 200
    body = r.get_json()["data"]["product"]
    assert body["id"] == product["id"]
    assert set(c["color_name"] for c in body["colors"]) == {"Walnut", "Black"}


def test_inactive_product_not_publicly_retrievable(client, admin_headers, product):
    client.put(f"/api/admin/products/{product['id']}", json={"is_active": False}, headers=admin_headers)
    r = client.get(f"/api/products/{product['slug']}")
    assert r.status_code == 404


def test_admin_can_update_product_preserving_slug_on_unrelated_edit(client, admin_headers, product):
    r = client.put(f"/api/admin/products/{product['id']}", json={"stock_quantity": 3}, headers=admin_headers)
    assert r.status_code == 200
    body = r.get_json()["data"]["product"]
    assert body["slug"] == product["slug"]
    assert body["stock_quantity"] == 3


def test_admin_can_update_product_colors(client, admin_headers, product):
    r = client.put(f"/api/admin/products/{product['id']}", json={
        "colors": [{"color_name": "Beige"}]
    }, headers=admin_headers)
    body = r.get_json()["data"]["product"]
    assert [c["color_name"] for c in body["colors"]] == ["Beige"]


def test_product_search_by_name(client, product):
    r = client.get("/api/products", query_string={"search": "Sheesham"})
    assert r.status_code == 200
    assert any(p["id"] == product["id"] for p in r.get_json()["data"]["items"])


def test_product_filter_by_material(client, product):
    r = client.get("/api/products", query_string={"material": "Sheesham"})
    assert any(p["id"] == product["id"] for p in r.get_json()["data"]["items"])


def test_product_filter_by_color(client, product):
    r = client.get("/api/products", query_string={"color": "Walnut"})
    assert r.status_code == 200
    assert any(p["id"] == product["id"] for p in r.get_json()["data"]["items"])


def test_product_filter_by_price_range(client, product):
    r = client.get("/api/products", query_string={"min_price": 70000, "max_price": 90000})
    assert any(p["id"] == product["id"] for p in r.get_json()["data"]["items"])
    r2 = client.get("/api/products", query_string={"min_price": 200000, "max_price": 300000})
    assert not any(p["id"] == product["id"] for p in r2.get_json()["data"]["items"])


def test_product_sort_price_low_to_high(client, admin_headers, category):
    client.post("/api/admin/products", json={"name": "Cheap Item", "category_id": category["id"], "original_price": 1000}, headers=admin_headers)
    client.post("/api/admin/products", json={"name": "Expensive Item", "category_id": category["id"], "original_price": 900000}, headers=admin_headers)
    r = client.get("/api/products", query_string={"sort": "price_low"})
    items = r.get_json()["data"]["items"]
    prices = [i["sale_price"] or i["original_price"] for i in items]
    assert prices == sorted(prices)


def test_product_pagination(client, admin_headers, category):
    for i in range(5):
        client.post("/api/admin/products", json={"name": f"Item {i}", "category_id": category["id"], "original_price": 1000}, headers=admin_headers)
    r = client.get("/api/products", query_string={"page": 1, "limit": 2})
    body = r.get_json()["data"]
    assert len(body["items"]) == 2
    assert body["total"] >= 5
    assert body["total_pages"] >= 3


def test_out_of_stock_product_disables_add_to_cart(client, admin_headers, product, customer_headers):
    client.put(f"/api/admin/products/{product['id']}", json={"availability": "out_of_stock"}, headers=admin_headers)
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1}, headers=customer_headers)
    assert r.status_code == 400
