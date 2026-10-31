import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { useProducts, useCategories, useProductFilterOptions } from "../../hooks/useCatalog";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton, EmptyState, Pagination } from "../ui/Feedback";
import type { ProductFilters } from "../../services/products";

const SORT_OPTIONS: { value: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "discount", label: "Highest Discount" },
  { value: "featured", label: "Featured" },
];

export default function ProductBrowser({ lockedCategorySlug, title }: { lockedCategorySlug?: string; title?: string }) {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: categories } = useCategories();
  const { data: filterOptions } = useProductFilterOptions();

  const page = Number(params.get("page") || 1);
  const search = params.get("search") || "";
  const material = params.get("material") || "";
  const color = params.get("color") || "";
  const minPrice = params.get("min_price") || "";
  const maxPrice = params.get("max_price") || "";
  const sort = (params.get("sort") as ProductFilters["sort"]) || "newest";
  const onSale = params.get("is_on_sale") === "true";

  const filters: ProductFilters = useMemo(
    () => ({
      page,
      limit: 12,
      search: search || undefined,
      category: lockedCategorySlug,
      material: material || undefined,
      color: color || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      sort,
      is_on_sale: onSale || undefined,
    }),
    [page, search, lockedCategorySlug, material, color, minPrice, maxPrice, sort, onSale]
  );

  const { data, isLoading, isFetching } = useProducts(filters);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  function clearFilters() {
    setParams(lockedCategorySlug ? new URLSearchParams() : new URLSearchParams());
  }

  const activeFilterCount = [material, color, minPrice, maxPrice, onSale ? "1" : ""].filter(Boolean).length;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [page]);

  const FilterPanel = (
    <div className="space-y-8">
      {!lockedCategorySlug && (
        <div>
          <p className="mb-3 text-sm font-semibold text-charcoal">Category</p>
          <div className="space-y-2">
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam("category", params.get("category") === c.slug ? null : c.slug)}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  params.get("category") === c.slug ? "bg-walnut text-ivory-100" : "text-charcoal/70 hover:bg-sand-light"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-charcoal">Material</p>
        <div className="flex flex-wrap gap-2">
          {(filterOptions?.materials ?? []).map((m) => (
            <button
              key={m}
              onClick={() => updateParam("material", material === m ? null : m)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                material === m ? "border-walnut bg-walnut text-ivory-100" : "border-charcoal/15 text-charcoal/70 hover:border-walnut"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-charcoal">Color</p>
        <div className="flex flex-wrap gap-2">
          {(filterOptions?.colors ?? []).map((c) => (
            <button
              key={c}
              onClick={() => updateParam("color", color === c ? null : c)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                color === c ? "border-walnut bg-walnut text-ivory-100" : "border-charcoal/15 text-charcoal/70 hover:border-walnut"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-charcoal">Price (PKR)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam("min_price", e.target.value || null)}
            className="input-field !py-2 text-sm"
          />
          <span className="text-charcoal/40">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam("max_price", e.target.value || null)}
            className="input-field !py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal/80">
        <input
          type="checkbox"
          checked={onSale}
          onChange={(e) => updateParam("is_on_sale", e.target.checked ? "true" : null)}
          className="h-4 w-4 rounded border-charcoal/30 text-walnut focus:ring-walnut"
        />
        On Sale Only
      </label>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="btn-ghost text-sm">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-editorial py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-charcoal">{title ?? "Shop All Furniture"}</h1>
          {data && <p className="mt-1 text-sm text-charcoal/60">{data.total} pieces found</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="btn-secondary !px-4 !py-2.5 text-sm lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="input-field !w-auto !py-2.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{FilterPanel}</aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-charcoal/50" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto bg-ivory-100 p-6">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-lg">Filters</p>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              {FilterPanel}
              <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-8 w-full">
                Show {data?.total ?? ""} Results
              </button>
            </div>
          </div>
        )}

        <div>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : (data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No products found" description="Try adjusting or clearing your filters." action={<button onClick={clearFilters} className="btn-secondary">Clear Filters</button>} />
          ) : (
            <div className={`grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
              {data?.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {data && <Pagination page={data.page} totalPages={data.total_pages} onChange={(p) => updateParam("page", String(p))} />}
        </div>
      </div>
    </div>
  );
}
