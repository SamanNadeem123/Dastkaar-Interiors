import re
import random
import string


def slugify(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "item"


def unique_slug(base_text: str, exists_fn, current_id=None) -> str:
    """
    Generates a unique slug using exists_fn(slug) -> bool that checks the DB.
    Appends -2, -3, ... until unique. current_id lets updates keep their own slug.
    """
    base = slugify(base_text)
    candidate = base
    counter = 2
    while exists_fn(candidate, current_id):
        candidate = f"{base}-{counter}"
        counter += 1
    return candidate


def generate_sku(prefix: str = "NAFV") -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"
