import { Link } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { useCart } from "../../hooks/useCart";

function formatPKR(amount: number) {
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [imgLoaded, setImgLoaded] = useState(false);
  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
  const hasDiscount = product.sale_price != null && product.sale_price < product.original_price;
  const isOutOfStock = product.availability === "out_of_stock";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    addItem(product, 1, product.colors[0]?.color_name ?? null);
  }

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-sand-light">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 ease-editorial group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-charcoal/30">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="rounded-full bg-charcoal px-2.5 py-1 text-[11px] font-semibold text-ivory-100">New</span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-walnut px-2.5 py-1 text-[11px] font-semibold text-ivory-100">
              -{product.discount_percent}%
            </span>
          )}
          {product.is_featured && (
            <span className="rounded-full bg-brass px-2.5 py-1 text-[11px] font-semibold text-ivory-100">Featured</span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/40">
            <span className="rounded-full bg-ivory-100 px-3 py-1 text-xs font-semibold text-charcoal">Out of Stock</span>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="absolute inset-x-3 bottom-3 translate-y-2 rounded-card bg-ivory-100/95 py-2.5 text-sm font-semibold text-charcoal opacity-0 shadow-soft transition-all duration-300 ease-editorial group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>

      <div className="mt-3.5">
        <p className="text-[13px] uppercase tracking-wide text-charcoal/40">{product.category?.name}</p>
        <h3 className="mt-1 font-display text-base text-charcoal">{product.name}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-semibold text-charcoal">
            {formatPKR(product.sale_price ?? product.original_price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-charcoal/40 line-through">{formatPKR(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export { formatPKR };
