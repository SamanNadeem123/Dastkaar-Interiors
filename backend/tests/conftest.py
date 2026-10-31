import pytest
from app import create_app
from app.config import TestingConfig
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(autouse=True)
def _clean_tables(app):
    """Truncates all tables between tests so each test starts from a blank
    slate without paying the cost of drop_all/create_all every time."""
    yield
    with app.app_context():
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


def register_admin(client, email="admin@test.com", phone="923010000001", password="AdminPass123!"):
    return client.post("/api/auth/admin/signup", json={
        "full_name": "Admin User", "email": email, "phone": phone,
        "password": password, "confirm_password": password,
        "admin_signup_key": "test-signup-key",
    })


def register_customer(client, email="customer@test.com", phone="923010000002", password="CustPass123!"):
    return client.post("/api/auth/register", json={
        "full_name": "Customer User", "email": email, "phone": phone,
        "password": password, "confirm_password": password,
    })


@pytest.fixture
def admin_token(client):
    register_admin(client)
    r = client.post("/api/auth/login", json={"identifier": "admin@test.com", "password": "AdminPass123!"})
    return r.get_json()["data"]["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def customer_token(client):
    register_customer(client)
    r = client.post("/api/auth/login", json={"identifier": "customer@test.com", "password": "CustPass123!"})
    return r.get_json()["data"]["access_token"]


@pytest.fixture
def customer_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}


@pytest.fixture
def category(client, admin_headers):
    r = client.post("/api/admin/categories", json={"name": "Sofas"}, headers=admin_headers)
    return r.get_json()["data"]["category"]


@pytest.fixture
def product(client, admin_headers, category):
    r = client.post("/api/admin/products", json={
        "name": "Test Sheesham Sofa", "category_id": category["id"],
        "original_price": 100000, "sale_price": 80000,
        "material": "Sheesham", "wood_type": "Sheesham",
        "stock_quantity": 10, "availability": "in_stock",
        "colors": [{"color_name": "Walnut"}, {"color_name": "Black"}],
    }, headers=admin_headers)
    return r.get_json()["data"]["product"]
