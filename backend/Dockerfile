FROM python:3.12-slim

WORKDIR /app

# System deps needed to build psycopg2 and other native wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Local-fallback image uploads (used when Cloudinary isn't configured) live here
RUN mkdir -p /app/static/uploads

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Runs migrations, then starts the app via gunicorn with an eventlet worker
# (required for Flask-SocketIO; a single eventlet worker handles many
# concurrent connections internally via greenlets, so -w 1 is correct here,
# not a bottleneck). For plain local development, `python run.py` is simpler
# and is what the README's non-Docker instructions use instead.
CMD ["sh", "-c", "flask db upgrade && gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 --timeout 120 run:app"]
