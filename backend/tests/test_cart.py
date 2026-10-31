def test_cart_requires_auth(client):
    r = client.get("/api/cart")
    assert r.status_code == 401


def test_add_item_to_cart(client, customer_headers, product):
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 2, "selected_color": "Walnut"}, headers=customer_headers)
    assert r.status_code == 201
    item = r.get_json()["data"]["cart"]["items"][0]
    assert item["quantity"] == 2
    assert item["line_total"] == 160000.0  # 2 * 80000 sale price


def test_add_item_invalid_color_rejected(client, customer_headers, product):
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1, "selected_color": "Neon Pink"}, headers=customer_headers)
    assert r.status_code == 400


def test_adding_same_product_color_combines_quantity(client, customer_headers, product):
    client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1, "selected_color": "Walnut"}, headers=customer_headers)
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 2, "selected_color": "Walnut"}, headers=customer_headers)
    items = r.get_json()["data"]["cart"]["items"]
    assert len(items) == 1
    assert items[0]["quantity"] == 3


def test_update_cart_item_quantity(client, customer_headers, product):
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1}, headers=customer_headers)
    item_id = r.get_json()["data"]["cart"]["items"][0]["id"]
    r = client.put(f"/api/cart/items/{item_id}", json={"quantity": 5}, headers=customer_headers)
    assert r.get_json()["data"]["cart"]["items"][0]["quantity"] == 5


def test_remove_cart_item(client, customer_headers, product):
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1}, headers=customer_headers)
    item_id = r.get_json()["data"]["cart"]["items"][0]["id"]
    r = client.delete(f"/api/cart/items/{item_id}", headers=customer_headers)
    assert r.status_code == 200
    assert r.get_json()["data"]["cart"]["items"] == []


def test_cannot_modify_another_users_cart_item(client, customer_headers, product, app):
    r = client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1}, headers=customer_headers)
    item_id = r.get_json()["data"]["cart"]["items"][0]["id"]

    # A second, different customer should not be able to touch this item.
    client.post("/api/auth/register", json={
        "full_name": "Other", "email": "other@test.com", "phone": "923010000077",
        "password": "OtherPass123!", "confirm_password": "OtherPass123!",
    })
    r2 = client.post("/api/auth/login", json={"identifier": "other@test.com", "password": "OtherPass123!"})
    other_headers = {"Authorization": f"Bearer {r2.get_json()['data']['access_token']}"}

    r3 = client.delete(f"/api/cart/items/{item_id}", headers=other_headers)
    assert r3.status_code == 404


def test_guest_cart_merge_combines_quantities(client, customer_headers, product):
    client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1, "selected_color": "Black"}, headers=customer_headers)
    r = client.post("/api/cart/merge", json={
        "items": [{"product_id": product["id"], "quantity": 2, "selected_color": "Black"}]
    }, headers=customer_headers)
    items = r.get_json()["data"]["cart"]["items"]
    assert len(items) == 1
    assert items[0]["quantity"] == 3


def test_guest_cart_merge_skips_invalid_items_silently(client, customer_headers, product):
    r = client.post("/api/cart/merge", json={
        "items": [{"product_id": 999999, "quantity": 1}]
    }, headers=customer_headers)
    assert r.status_code == 200
    assert r.get_json()["data"]["cart"]["items"] == []


def test_clear_cart(client, customer_headers, product):
    client.post("/api/cart/items", json={"product_id": product["id"], "quantity": 1}, headers=customer_headers)
    r = client.delete("/api/cart", headers=customer_headers)
    assert r.status_code == 200
    r2 = client.get("/api/cart", headers=customer_headers)
    assert r2.get_json()["data"]["cart"]["items"] == []
