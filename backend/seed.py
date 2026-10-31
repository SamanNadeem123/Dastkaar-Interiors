"""
Seed script for NA FURNITURE VALLEY.

Usage:
    python seed.py

Populates: categories, demo products (with colors), delivery zones, store
settings, and one development-only admin account. All product data below is
clearly fictional demo content, not real business data.
"""
import os
from app import create_app
from app.extensions import db
from app.models import Category, Product, ProductColor, DeliveryZone, Setting, User

app = create_app()


CATEGORIES = [
    {"name": "Sofas", "description": "Premium sofas crafted for comfort and modern living."},
    {"name": "Bed Sets", "description": "Complete bedroom sets combining elegance and craftsmanship."},
    {"name": "Center Tables", "description": "Statement center tables for your living room."},
    {"name": "Dining Tables", "description": "Dining tables built to bring people together."},
    {"name": "Setties", "description": "Classic settees for compact, stylish seating."},
    {"name": "Bedroom Chairs", "description": "Accent chairs designed for the modern bedroom."},
    {"name": "Office Furniture", "description": "Executive and ergonomic furniture for the workplace."},
]

# (category_name, name, material, wood_type, original_price, sale_price, dims(w,h,d,l), colors)
PRODUCTS = [
    ("Sofas", "Luxury Sheesham Sofa", "Solid Wood", "Sheesham", 185000, 149000, (84, 34, 38, None), ["Walnut", "Dark Brown", "Beige"]),
    ("Sofas", "Chesterfield Leatherette Sofa", "Leatherette", "Engineered Wood", 210000, None, (90, 30, 36, None), ["Black", "Tan"]),
    ("Sofas", "Modern L-Shape Sectional", "Fabric", "Solid Wood", 265000, 229000, (110, 32, 65, None), ["Charcoal", "Sand", "Ivory"]),
    ("Bed Sets", "Royal Walnut Bed Set", "Solid Wood", "Walnut", 320000, 275000, (76, 44, 82, None), ["Walnut", "Natural"]),
    ("Bed Sets", "Minimalist Oak Bed Set", "Solid Wood", "Oak", 245000, None, (72, 40, 80, None), ["Natural", "White"]),
    ("Center Tables", "Sheesham Coffee Table", "Solid Wood", "Sheesham", 42000, 34000, (40, 18, 24, None), ["Walnut", "Natural"]),
    ("Center Tables", "Glass Top Center Table", "Glass & MDF", "MDF", 38000, None, (44, 16, 24, None), ["Black", "White"]),
    ("Dining Tables", "6-Seater Sheesham Dining Set", "Solid Wood", "Sheesham", 175000, 155000, (72, 30, 36, None), ["Walnut", "Dark Brown"]),
    ("Dining Tables", "Compact 4-Seater Dining Set", "Engineered Wood", "MDF", 95000, None, (48, 30, 32, None), ["Natural", "White"]),
    ("Setties", "Classic Two-Seater Settee", "Fabric", "Sheesham", 68000, 55000, (52, 32, 30, None), ["Beige", "Grey"]),
    ("Bedroom Chairs", "Accent Bedroom Chair", "Velvet", "Solid Wood", 32000, None, (26, 32, 28, None), ["Blush", "Emerald", "Charcoal"]),
    ("Bedroom Chairs", "Wingback Reading Chair", "Fabric", "Solid Wood", 45000, 39000, (28, 40, 30, None), ["Navy", "Beige"]),
    ("Office Furniture", "Executive Office Desk", "Engineered Wood", "MDF", 88000, None, (60, 30, 28, None), ["Walnut", "Black"]),
    ("Office Furniture", "Ergonomic Office Chair", "Mesh & Leatherette", "N/A", 34000, 27000, (26, 44, 26, None), ["Black"]),
]

DELIVERY_ZONES = [
    ("Lahore", 2000),
    ("Islamabad", 5000),
    ("Rawalpindi", 5000),
    ("Karachi", 8000),
    ("Faisalabad", 6000),
]


def run():
    with app.app_context():
        db.create_all()

        # ---- Categories ----
        cat_map = {}
        for c in CATEGORIES:
            existing = Category.query.filter_by(name=c["name"]).first()
            if existing:
                cat_map[c["name"]] = existing
                continue
            from app.utils.slugify import slugify
            category = Category(name=c["name"], slug=slugify(c["name"]), description=c["description"])
            db.session.add(category)
            db.session.flush()
            cat_map[c["name"]] = category
        db.session.commit()
        print(f"Seeded {len(cat_map)} categories.")

        # ---- Products ----
        from app.utils.slugify import slugify, unique_slug, generate_sku

        def slug_exists(slug, current_id=None):
            return Product.query.filter_by(slug=slug).first() is not None

        created_count = 0
        for (cat_name, name, material, wood_type, price, sale_price, dims, colors) in PRODUCTS:
            if Product.query.filter_by(name=name).first():
                continue
            width, height, depth, length = dims
            product = Product(
                category_id=cat_map[cat_name].id,
                name=name,
                slug=unique_slug(name, slug_exists),
                sku=generate_sku(),
                short_description=f"{name} — {material} finish, built for everyday elegance.",
                description=(
                    f"The {name} brings together {material.lower()} craftsmanship and a "
                    f"timeless silhouette, designed for modern Pakistani homes. Each piece is "
                    f"finished by hand and built to last for years of everyday use."
                ),
                original_price=price,
                sale_price=sale_price,
                material=material,
                wood_type=wood_type,
                width=width, height=height, depth=depth, length=length,
                dimension_unit="in",
                availability="in_stock",
                stock_quantity=12,
                is_featured=created_count % 4 == 0,
                is_new=created_count % 3 == 0,
                is_on_sale=sale_price is not None,
                is_active=True,
            )
            db.session.add(product)
            db.session.flush()
            for color in colors:
                db.session.add(ProductColor(product_id=product.id, color_name=color))
            created_count += 1
        db.session.commit()
        print(f"Seeded {created_count} products.")

        # ---- Delivery zones ----
        zone_count = 0
        for city, fee in DELIVERY_ZONES:
            if DeliveryZone.query.filter_by(city_name=city).first():
                continue
            db.session.add(DeliveryZone(city_name=city, fee=fee, is_active=True))
            zone_count += 1
        db.session.commit()
        print(f"Seeded {zone_count} delivery zones.")

        # ---- Store settings ----
        for key, value in Setting.DEFAULTS.items():
            if not Setting.query.filter_by(key=key).first():
                db.session.add(Setting(key=key, value=value))
        db.session.commit()
        print("Seeded store settings.")

        # ---- Development-only demo admin ----
        dev_admin_email = os.environ.get("SEED_ADMIN_EMAIL", "admin@nafurniturevalley.dev")
        if not User.query.filter_by(email=dev_admin_email).first():
            admin = User(
                full_name="NA Furniture Valley Admin",
                email=dev_admin_email,
                phone="923000000001",
                role="admin",
            )
            admin.set_password(os.environ.get("SEED_ADMIN_PASSWORD", "DevAdmin123!"))
            db.session.add(admin)
            db.session.commit()
            print(
                "Seeded a DEVELOPMENT-ONLY admin account:\n"
                f"  Email:    {dev_admin_email}\n"
                f"  Password: {os.environ.get('SEED_ADMIN_PASSWORD', 'DevAdmin123!')}\n"
                "  Change or remove this account before deploying to production."
            )

        print("Seeding complete.")


if __name__ == "__main__":
    run()
