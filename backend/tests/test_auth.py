from tests.conftest import register_admin, register_customer


def test_customer_registration_success(client):
    r = register_customer(client)
    assert r.status_code == 201
    body = r.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["role"] == "customer"
    assert "password" not in body["data"]["user"]
    assert "password_hash" not in body["data"]["user"]


def test_customer_registration_duplicate_email_rejected(client):
    register_customer(client)
    r = register_customer(client, phone="923010000099")  # same email, different phone
    assert r.status_code == 409


def test_customer_registration_password_mismatch(client):
    r = client.post("/api/auth/register", json={
        "full_name": "X", "email": "x@test.com", "phone": "923010009999",
        "password": "abcdef", "confirm_password": "different",
    })
    assert r.status_code == 422


def test_login_success(client):
    register_customer(client)
    r = client.post("/api/auth/login", json={"identifier": "customer@test.com", "password": "CustPass123!"})
    assert r.status_code == 200
    assert "access_token" in r.get_json()["data"]


def test_login_wrong_password_rejected(client):
    register_customer(client)
    r = client.post("/api/auth/login", json={"identifier": "customer@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_login_with_phone_identifier(client):
    register_customer(client)
    r = client.post("/api/auth/login", json={"identifier": "923010000002", "password": "CustPass123!"})
    assert r.status_code == 200


def test_admin_signup_requires_correct_key(client):
    r = client.post("/api/auth/admin/signup", json={
        "full_name": "Admin", "email": "a@test.com", "phone": "923010000005",
        "password": "AdminPass123!", "confirm_password": "AdminPass123!",
        "admin_signup_key": "wrong-key",
    })
    assert r.status_code == 403


def test_admin_signup_success_with_correct_key(client):
    r = register_admin(client)
    assert r.status_code == 201
    assert r.get_json()["data"]["user"]["role"] == "admin"


def test_admin_signup_disabled_returns_403(client, app):
    app.config["ADMIN_SIGNUP_ENABLED"] = False
    try:
        r = register_admin(client, email="another@test.com", phone="923010000009")
        assert r.status_code == 403
    finally:
        app.config["ADMIN_SIGNUP_ENABLED"] = True


def test_me_endpoint_requires_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_endpoint_returns_current_user(client, customer_headers):
    r = client.get("/api/auth/me", headers=customer_headers)
    assert r.status_code == 200
    assert r.get_json()["data"]["user"]["email"] == "customer@test.com"
