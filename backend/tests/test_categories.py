def test_admin_can_create_category(client, admin_headers):
    r = client.post("/api/admin/categories", json={"name": "Dining Tables", "description": "Nice tables"}, headers=admin_headers)
    assert r.status_code == 201
    body = r.get_json()["data"]["category"]
    assert body["slug"] == "dining-tables"
    assert body["is_active"] is True


def test_category_creation_requires_admin(client, customer_headers):
    r = client.post("/api/admin/categories", json={"name": "Dining Tables"}, headers=customer_headers)
    assert r.status_code == 403


def test_duplicate_category_name_gets_unique_slug(client, admin_headers):
    r1 = client.post("/api/admin/categories", json={"name": "Sofas"}, headers=admin_headers)
    r2 = client.post("/api/admin/categories", json={"name": "Sofas"}, headers=admin_headers)
    assert r1.status_code == 201 and r2.status_code == 201
    assert r1.get_json()["data"]["category"]["slug"] != r2.get_json()["data"]["category"]["slug"]


def test_public_category_list_only_shows_active(client, admin_headers):
    r = client.post("/api/admin/categories", json={"name": "Hidden Category", "is_active": False}, headers=admin_headers)
    client.post("/api/admin/categories", json={"name": "Visible Category"}, headers=admin_headers)
    r = client.get("/api/categories")
    names = [c["name"] for c in r.get_json()["data"]["items"]]
    assert "Visible Category" in names
    assert "Hidden Category" not in names


def test_get_category_by_slug(client, category):
    r = client.get(f"/api/categories/{category['slug']}")
    assert r.status_code == 200
    assert r.get_json()["data"]["category"]["id"] == category["id"]


def test_category_delete_with_products_archives_instead(client, admin_headers, category, product):
    r = client.delete(f"/api/admin/categories/{category['id']}", headers=admin_headers)
    assert r.status_code == 200
    body = r.get_json()
    assert body["data"]["category"]["is_active"] is False


def test_category_delete_without_products_deletes(client, admin_headers, category):
    r = client.delete(f"/api/admin/categories/{category['id']}", headers=admin_headers)
    assert r.status_code == 200
    assert r.get_json()["data"] == {}
