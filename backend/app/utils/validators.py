import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")


def is_valid_email(value: str) -> bool:
    return bool(value) and bool(EMAIL_RE.match(value.strip()))


def is_valid_phone(value: str) -> bool:
    return bool(value) and bool(PHONE_RE.match(value.strip().replace(" ", "").replace("-", "")))


def paginate_args(request, default_limit=20, max_limit=60):
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        limit = int(request.args.get("limit", default_limit))
    except (TypeError, ValueError):
        limit = default_limit
    limit = max(1, min(limit, max_limit))
    return page, limit


def paginated_response(query, page, limit, serializer):
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit if limit else 1
    return {
        "items": [serializer(i) for i in items],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": max(total_pages, 1),
    }
