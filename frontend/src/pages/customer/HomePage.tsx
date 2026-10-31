import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Hammer } from "lucide-react";
import { useCategories, useProducts } from "../../hooks/useCatalog";
import ProductCard from "../../components/customer/ProductCard";
import { ProductGridSkeleton } from "../../components/ui/Feedback";

export default function HomePage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: featured, isLoading: featuredLoading } = useProducts({ is_featured: true, limit: 8, sort: "featured" });

  const bigCategories = (categories ?? []).slice(0, 2);
  const smallCategories = (categories ?? []).slice(2, 6);

  return (
    <div>
      {/* Hero - asymmetric, left-aligned headline against a large photograph */}
      <section className="container-editorial grid grid-cols-1 items-center gap-10 py-10 sm:py-16 lg:grid-cols-5 lg:gap-8 lg:py-20">
        <div className="lg:col-span-2">
          <p className="section-eyebrow">Handcrafted in Pakistan</p>
          <h1 className="mt-4 font-display text-display-xl text-charcoal">
            Furniture crafted for modern living
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/70">
            Sheesham, oak, and walnut pieces built by hand, from the first sketch to the piece in your living room.
            Explore sofas, dining sets, and bedroom furniture made to last for years, not seasons.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/products" className="btn-primary">
              Shop Now <ArrowRight size={16} />
            </Link>
            <Link to="/category/sofas" className="btn-secondary">
              Explore Collection
            </Link>
          </div>
        </div>

        <div className="relative lg:col-span-3">
          <div className="animate-[fadeIn_1s_ease-editorial] aspect-[16/11] w-full overflow-hidden rounded-card">
            <img
              src="https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1400&q=80"
              alt="A handcrafted wooden sofa in a sunlit modern living room"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-card bg-ivory-100 p-5 shadow-lift sm:block">
            <p className="font-display text-2xl text-walnut">14+</p>
            <p className="text-xs text-charcoal/60">Handcrafted collections</p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-charcoal/10 bg-sand-light/50">
        <div className="container-editorial grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <Hammer className="shrink-0 text-walnut" size={28} />
            <div>
              <p className="text-sm font-semibold text-charcoal">Solid Craftsmanship</p>
              <p className="text-sm text-charcoal/60">Sheesham, oak, and walnut wood</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Truck className="shrink-0 text-walnut" size={28} />
            <div>
              <p className="text-sm font-semibold text-charcoal">Nationwide Delivery</p>
              <p className="text-sm text-charcoal/60">Transparent delivery charges by city</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheck className="shrink-0 text-walnut" size={28} />
            <div>
              <p className="text-sm font-semibold text-charcoal">Cash on Delivery</p>
              <p className="text-sm text-charcoal/60">Or pay securely online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured categories - asymmetric bento grid, not identical cards */}
      <section className="container-editorial py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">Browse by room</p>
            <h2 className="mt-2 font-display text-display-md">Featured Categories</h2>
          </div>
          <Link to="/products" className="btn-ghost hidden sm:inline-flex">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-card bg-sand-light" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {bigCategories.map((c) => (
              <Link key={c.id} to={`/category/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-card">
                <img
                  src={c.image_url || "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80"}
                  alt={c.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/0 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <h3 className="font-display text-xl text-ivory-100">{c.name}</h3>
                  <p className="text-xs text-ivory-200/80">{c.product_count ?? 0} pieces</p>
                </div>
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-5 sm:col-span-2 sm:grid-cols-4">
              {smallCategories.map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`} className="group relative block aspect-square overflow-hidden rounded-card">
                  <img
                    src={c.image_url || "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=500&q=80"}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-charcoal/40" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-display text-sm text-ivory-100">{c.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="container-editorial pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">Handpicked</p>
            <h2 className="mt-2 font-display text-display-md">Featured Pieces</h2>
          </div>
          <Link to="/products" className="btn-ghost hidden sm:inline-flex">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {featuredLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {(featured?.items ?? []).slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
