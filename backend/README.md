# NA FURNITURE VALLEY — Backend

Flask REST API + Socket.IO backend for the NA FURNITURE VALLEY e-commerce platform.

## Requirements

- Python 3.11+
- PostgreSQL 14+ (running locally or accessible remotely)

## 1. Clone and enter the backend folder

```bash
cd backend
```

## 2. Create a virtual environment and install dependencies

```bash
python3 -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

## 3. Create the PostgreSQL database

```bash
# Using psql:
psql -U postgres -c "CREATE DATABASE na_furniture_valley;"
```

## 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` — e.g. `postgresql://postgres:postgres@localhost:5432/na_furniture_valley`
- `SECRET_KEY`, `JWT_SECRET_KEY` — any long random strings for local dev
- `ADMIN_SIGNUP_ENABLED=True` and `ADMIN_SIGNUP_KEY` — set a real secret before creating your first admin, then set `ADMIN_SIGNUP_ENABLED=False` afterwards

Cloudinary, SMTP, and payment gateway variables can be left blank for local
development — the app automatically falls back to local-disk image storage,
console-logged emails, and a sandbox payment provider when they are not set.

## 5. Run database migrations

```bash
export FLASK_APP=run.py      # Windows (cmd): set FLASK_APP=run.py
flask db upgrade
```

## 6. Seed demo data (optional but recommended)

```bash
python seed.py
```

This creates 7 categories, 14 demo products, 5 delivery zones, default store
settings, and prints a **development-only** admin login:

```
Email:    admin@nafurniturevalley.dev
Password: DevAdmin123!
```

Change `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars to customize, and
never use these credentials in production.

## 7. Run the server

```bash
python run.py
```

The API is now available at `http://localhost:5000/api`, with Socket.IO on
the same port. Verify with:

```bash
curl http://localhost:5000/api/health
```

## Running tests

Tests use a separate PostgreSQL database so they never touch your dev data:

```bash
psql -U postgres -c "CREATE DATABASE na_furniture_valley_test;"
pytest
```

## Creating additional admin accounts

Admin signup is gated by two env vars for security:

- `ADMIN_SIGNUP_ENABLED` — must be `True` to allow `POST /api/auth/admin/signup`
- `ADMIN_SIGNUP_KEY` — a secret the requester must supply in the request body

Once your initial admin account(s) exist, set `ADMIN_SIGNUP_ENABLED=False`.

## Project structure

```
backend/
  app/
    __init__.py        # app factory
    config.py           # environment-driven configuration
    extensions.py        # Flask extension instances
    sockets.py           # Socket.IO connection handlers
    models/              # SQLAlchemy models
    schemas/              # Marshmallow request validation
    routes/               # Blueprints (public + /admin)
    services/              # business logic (orders, payments, email, images, notifications)
    middleware/             # auth decorators, error handlers
    utils/                   # slugify, validators, response helpers
  migrations/               # Alembic migrations
  tests/                    # pytest suite
  seed.py
  run.py
  requirements.txt
  .env.example
```
