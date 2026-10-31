import pytest

ADMIN_ENDPOINTS = [
    ("GET", "/api/admin/dashboard/stats"),
    ("GET", "/api/admin/products"),
    ("GET", "/api/admin/categories"),
    ("GET", "/api/admin/orders"),
    ("GET", "/api/admin/customers"),
    ("GET", "/api/admin/delivery/zones"),
    ("GET", "/api/admin/reviews"),
    ("GET", "/api/admin/gallery"),
    ("GET", "/api/admin/settings"),
    ("GET", "/api/admin/notifications"),
]


@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
def test_unauthenticated_request_blocked(client, method, path):
    r = client.open(path, method=method)
    assert r.status_code == 401


@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
def test_customer_role_blocked_from_admin_endpoints(client, customer_headers, method, path):
    r = client.open(path, method=method, headers=customer_headers)
    assert r.status_code == 403


@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
def test_admin_role_allowed(client, admin_headers, method, path):
    r = client.open(path, method=method, headers=admin_headers)
    assert r.status_code == 200


def test_expired_or_garbage_token_rejected(client):
    r = client.get("/api/admin/dashboard/stats", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code in (401, 422)


def test_malformed_authorization_header_rejected(client):
    r = client.get("/api/admin/dashboard/stats", headers={"Authorization": "not-bearer-format"})
    assert r.status_code == 401
