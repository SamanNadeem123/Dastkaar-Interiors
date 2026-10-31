# NA Furniture Valley

A complete, production-ready full-stack e-commerce platform for **NA Furniture Valley**, a
premium furniture showroom — customer storefront, admin dashboard, real-time order
notifications, cart & checkout, and full inventory/order management, all built on one
shared Flask API and PostgreSQL database.

This is a real working application, not a UI mockup: adding a product in the admin
dashboard makes it appear on the storefront immediately, placing an order actually
deducts inventory and pushes a live Socket.IO notification to the admin dashboard, and
the backend recalculates every price/discount/delivery total itself rather than
trusting the frontend.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Quick start (Docker)](#quick-start-docker)
- [Quick start (manual / no Docker)](#quick-start-manual--no-docker)
- [Environment variables](#environment-variables)
- [Creating an admin account](#creating-an-admin-account)
- [Cloudinary, email, and payments (sandbox mode)](#cloudinary-email-and-payments-sandbox-mode)
- [Testing](#testing)
- [Production build & deployment](#production-build--deployment)
- [Troubleshooting](#troubleshooting)

## Features

**Customers** can browse categories, search/filter/sort products, view detailed product
pages (multiple images, dimensions, material, wood type, colors, availability), add to
cart as a guest or signed-in user, check out with Cash on Delivery or card (sandbox),
see delivery charges before ordering, track orders, and contact the showroom on
WhatsApp.

**Admins** can manage products (with multi-image upload, reordering, primary image),
categories, pricing/sales (discount % calculated automatically), stock, delivery zones,
customers, orders (with status history), reviews (moderation queue), the gallery, and
store-wide settings (branding, contact info, WhatsApp number) — with real-time
Socket.IO notifications and an unread counter the moment a new order comes in.

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query,
React Hook Form + Zod, Zustand, Socket.IO client, Axios, react-hot-toast.

**Backend:** Flask, SQLAlchemy, Flask-Migrate (Alembic), Flask-JWT-Extended,
Flask-SocketIO (eventlet), Flask-CORS, Flask-Limiter, Marshmallow, bcrypt.

**Database:** PostgreSQL.

**Images:** Cloudinary (falls back automatically to local disk storage under
`/static/uploads` when Cloudinary isn't configured, so the app works fully offline in
development).

**Payments:** Provider-agnostic `PaymentService` abstraction. Ships in **sandbox mode**
by default (no real gateway needed) with a `/api/payments/sandbox/confirm` endpoint to
exercise the full card-payment flow locally; swap in real gateway credentials via env
vars with no code changes.

**Email:** Flask-Mail over SMTP. If SMTP isn't configured, emails are logged to the
console instead of sent — the app keeps working, orders still get created.

## Architecture

```
Customer Storefront ──┐
                       ├──► Flask REST API ──► PostgreSQL
Admin Dashboard    ────┘        │      │
   (one React app,              │      └──► Cloudinary (or local disk fallback)
    two route trees)            │
                                 ├──► Socket.IO ──► Admin notification bell (live)
                                 ├──► Email service (SMTP or console log)
                                 └──► Payment service (sandbox or real gateway)
```

One shared Flask backend and one PostgreSQL database serve both the customer storefront
and the admin dashboard, which live in a single React app under separate route trees
(`/` vs `/admin/*`) with independent layouts.

## Folder structure

```
na-furniture-valley/
  backend/
    app/
      __init__.py        # app factory
      config.py           # environment-driven configuration
      extensions.py        # Flask extension instances
      sockets.py            # Socket.IO connection handlers (admin-room auth)
      models/                # SQLAlchemy models (16 tables)
      schemas/                 # Marshmallow request validation
      routes/                   # Blueprints: public + /admin
      services/                  # order/payment/email/cloudinary/notification logic
      middleware/                  # auth decorators, error handlers
      utils/                         # slugify, validators, response helpers
    migrations/                       # Alembic migrations
    tests/                              # pytest suite (104 tests)
    seed.py
    run.py
    requirements.txt
    Dockerfile
    .env.example
  frontend/
    src/
      pages/customer/    # storefront pages
      pages/admin/         # admin dashboard pages
      components/            # shared UI + customer/admin specific components
      layouts/                  # CustomerLayout, AdminLayout
      hooks/                      # useCatalog, useCart, useAuth, useAdminData, ...
      services/                     # typed API client per resource
      store/                          # Zustand: auth, guest cart
      types/                            # shared TypeScript types
    Dockerfile
    nginx.conf
    .env.example
  docker-compose.yml
  README.md   ← you are here
```

## Quick start (Docker)

Requires Docker and Docker Compose.

```bash
git clone <this-repo>
cd na-furniture-valley

cp backend/.env.example backend/.env
# Edit backend/.env if you want real Cloudinary/SMTP/payment credentials.
# It works out of the box with none of them set (sandbox/local-fallback mode).

docker compose build
docker compose up -d

# Run migrations + seed demo data inside the running backend container:
docker compose exec backend flask db upgrade
docker compose exec backend python seed.py
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

Seed prints a development-only admin login (see [Creating an admin
account](#creating-an-admin-account)).

To stop: `docker compose down` (add `-v` to also delete the database volume).

## Quick start (manual / no Docker)

### Requirements

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

psql -U postgres -c "CREATE DATABASE na_furniture_valley;"

cp .env.example .env
# Edit .env: at minimum set DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY, ADMIN_SIGNUP_KEY

export FLASK_APP=run.py         # Windows (cmd): set FLASK_APP=run.py
flask db upgrade
python seed.py

python run.py
```

The API is now running at `http://localhost:5000/api`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install

cp .env.example .env
# Defaults already point at http://localhost:5000 - only change these if your
# backend runs somewhere else.

npm run dev
```

The storefront is now running at `http://localhost:5173`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `TEST_DATABASE_URL` | Separate DB used only when running `pytest` |
| `SECRET_KEY`, `JWT_SECRET_KEY` | Flask/JWT signing secrets — use long random values |
| `FRONTEND_ORIGIN` | Allowed CORS/Socket.IO origin for the frontend |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Image storage; leave blank to use local-disk fallback |
| `MAIL_SERVER/PORT/USERNAME/PASSWORD`, `MAIL_DEFAULT_SENDER`, `ADMIN_EMAIL` | SMTP email; leave blank to log emails to console instead |
| `ADMIN_SIGNUP_ENABLED`, `ADMIN_SIGNUP_KEY` | Gates public admin signup — disable after creating your admin(s) |
| `WHATSAPP_NUMBER` | Powers every "Ask on WhatsApp" button, in one place |
| `PAYMENT_PROVIDER` | `sandbox` (default) or a real gateway identifier |
| `PAYMENT_PUBLIC_KEY/SECRET_KEY/WEBHOOK_SECRET` | Real gateway credentials, when applicable |
| `DEFAULT_DELIVERY_CHARGE`, `CURRENCY` | Store-wide defaults |

Full list with defaults: [`backend/.env.example`](backend/.env.example).

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend REST API |
| `VITE_SOCKET_URL` | Base URL for the Socket.IO connection |
| `VITE_STORE_NAME` | Display fallback for the brand name |
| `VITE_WHATSAPP_NUMBER` | Fallback WhatsApp number (the live value comes from `/api/settings`) |

Full list: [`frontend/.env.example`](frontend/.env.example).

**Neither `.env` file is committed** — both are gitignored, and only the `.env.example`
templates (with placeholder, non-functional values) ship in the repo.

## Creating an admin account

Two ways:

1. **`seed.py`** creates one development-only admin (`admin@nafurniturevalley.dev` /
   `DevAdmin123!` by default, or set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) — change
   or remove it before deploying anywhere real.
2. **`POST /api/auth/admin/signup`** (the `/admin/signup` page in the UI), gated by
   `ADMIN_SIGNUP_ENABLED=True` and the `ADMIN_SIGNUP_KEY` secret from your `.env`. Once
   your admin account(s) exist, set `ADMIN_SIGNUP_ENABLED=False` so the endpoint stops
   accepting new admins.

## Cloudinary, email, and payments (sandbox mode)

The app is designed to run completely locally with **zero external credentials**:

- **Images**: without Cloudinary credentials, uploads are saved to
  `backend/static/uploads/` and served directly by the Flask app.
- **Email**: without SMTP credentials, the email service logs what it would have sent
  instead of sending it — order creation and status updates still succeed either way.
- **Payments**: with `PAYMENT_PROVIDER=sandbox` (the default), card orders are created
  as `payment_status: pending`, and `POST /api/payments/sandbox/confirm` simulates the
  gateway confirming (or failing) the payment — no real card details are ever collected
  or stored by this application in any mode.

Add real Cloudinary/SMTP/gateway credentials to `.env` at any time — no code changes
required.

## Testing

```bash
cd backend
psql -U postgres -c "CREATE DATABASE na_furniture_valley_test;"
pytest
```

104 tests cover authentication, admin authorization (403 enforcement), product/category
CRUD, search/filter/sort/pagination, cart (including guest→auth merge), delivery zone
calculation, order creation (idempotency, stock validation, discount math, backend price
recalculation), inventory (stock deduction/restock, made-to-order bypass), and order
status transitions.

## Production build & deployment

**Frontend:**
```bash
cd frontend
npm run build   # outputs to dist/ - serve with nginx or any static host
```

**Backend:** set `DEBUG=False`, use real secrets, and run behind gunicorn with an
eventlet worker (required for Socket.IO):
```bash
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 run:app
```
This is exactly what `backend/Dockerfile` does. Put a reverse proxy (nginx, Caddy, your
platform's load balancer) in front of both services, terminate TLS there, and set
`FRONTEND_ORIGIN` to your real frontend URL for CORS/Socket.IO.

## Troubleshooting

- **CORS or Socket.IO connection errors** — check `FRONTEND_ORIGIN` in `backend/.env`
  matches the exact origin your frontend is served from.
- **`flask db upgrade` fails to connect** — confirm PostgreSQL is running and
  `DATABASE_URL` is correct; with Docker, the host must be `db`, not `localhost`.
- **Images don't load** — if using the local-disk fallback, confirm the backend is
  actually reachable at the same host/port referenced in the image URL it returns.
- **Admin signup returns 403** — check `ADMIN_SIGNUP_ENABLED=True` and that the
  `admin_signup_key` in your request matches `ADMIN_SIGNUP_KEY` in `.env`.
- **Orders show as unpaid after "successful" card payment** — expected in sandbox mode
  until `/api/payments/sandbox/confirm` is called (or your real gateway's webhook fires)
  — the backend never marks an order paid on the frontend's say-so alone.
