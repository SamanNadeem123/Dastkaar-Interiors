import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Truck, ShieldCheck } from "lucide-react";
import { useProduct, useRelatedProducts } from "../../hooks/useCatalog";
import { useCart } from "../../hooks/useCart";
import { formatPKR } from "../../components/customer/ProductCard";
import ProductCard from "../../components/customer/ProductCard";
import { WhatsAppInquiryButton } from "../../components/customer/WhatsAppButton";
import { EmptyState } from "../../components/ui/Feedback";

const AVAILABILITY_LABEL: Record<string, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  made_to_order: "Made to Order",
  coming_soon: "Coming Soon",
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug);
  const { data: related } = useRelatedProducts(slug);
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) return <div className="container-editorial py-24 text-center text-charcoal/50">Loading...</div>;
  if (!product) return <EmptyState title="Product not found" description="This piece may no longer be available." />;

  const images = product.images.length > 0 ? product.images : [{ id: 0, image_url: "", is_primary: true, sort_order: 0 }];
  const color = selectedColor ?? product.colors[0]?.color_name ?? null;
  const isOutOfStock = product.availability === "out_of_stock";
  const hasDiscount = product.sale_price != null && product.sale_price < product.original_price;

  const dims = [
    product.width && `W ${product.width}`,
    product.height && `H ${product.height}`,
    product.depth && `D ${product.depth}`,
    product.length && `L ${product.length}`,
  ].filter(Boolean);

  function handleBuyNow() {
    if (!product) return;
    addItem(product, quantity, color);
    navigate("/cart");
  }

  return (
    <div className="container-editorial py-12">
      <nav className="mb-8 text-xs text-charcoal/50">
        <Link to="/products" className="hover:text-walnut">Shop</Link>
        {product.category && (
          <>
            {" / "}
            <Link to={`/category/${product.category.slug}`} className="hover:text-walnut">{product.category.name}</Link>
          </>
        )}
        {" / "}
        <span className="text-charcoal/70">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-card bg-sand-light">
            {images[activeImage]?.image_url ? (
              <img src={images[activeImage].image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-charcoal/30">No image available</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-card border-2 transition-colors ${
                    i === activeImage ? "border-walnut" : "border-transparent"
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm uppercase tracking-wide text-charcoal/40">{product.category?.name}</p>
          <h1 className="mt-2 font-display text-display-md text-charcoal">{product.name}</h1>
          <p className="mt-1 text-xs text-charcoal/40">SKU: {product.sku}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-2xl text-charcoal">{formatPKR(product.sale_price ?? product.original_price)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-charcoal/40 line-through">{formatPKR(product.original_price)}</span>
                <span className="rounded-full bg-walnut/10 px-2.5 py-1 text-xs font-semibold text-walnut">
                  {product.discount_percent}% OFF
                </span>
              </>
            )}
          </div>

          <p className={`mt-3 text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-moss"}`}>
            {AVAILABILITY_LABEL[product.availability]}
          </p>

          {product.short_description && <p className="mt-5 text-sm leading-relaxed text-charcoal/70">{product.short_description}</p>}

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-charcoal">Color: {color}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.color_name)}
                    className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                      color === c.color_name ? "border-walnut bg-walnut text-ivory-100" : "border-charcoal/20 text-charcoal/70 hover:border-walnut"
                    }`}
                  >
                    {c.color_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <p className="text-sm font-semibold text-charcoal">Quantity</p>
            <div className="flex items-center rounded-card border border-charcoal/20">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-charcoal/70">−</button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(50, q + 1))} className="px-3 py-2 text-charcoal/70">+</button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => addItem(product, quantity, color)}
              disabled={isOutOfStock}
              className="btn-secondary flex-1"
            >
              Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={isOutOfStock} className="btn-primary flex-1">
              Buy Now
            </button>
          </div>

          <div className="mt-4">
            <WhatsAppInquiryButton
              message={`Hi, I am interested in the ${product.name}. Product price is ${formatPKR(
                product.sale_price ?? product.original_price
              )}. Please provide more details.`}
              className="btn-ghost"
            />
          </div>

          <div className="mt-8 space-y-2 border-t border-charcoal/10 pt-6 text-sm text-charcoal/70">
            <p className="flex items-center gap-2"><Truck size={16} className="text-walnut" /> Delivery charges calculated at checkout by city</p>
            <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-walnut" /> Cash on Delivery or secure card payment</p>
          </div>

          {/* Specifications */}
          <div className="mt-8 border-t border-charcoal/10 pt-6">
            <h2 className="font-display text-lg text-charcoal">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
              {product.material && (
                <>
                  <dt className="text-charcoal/50">Material</dt>
                  <dd className="text-charcoal">{product.material}</dd>
                </>
              )}
              {product.wood_type && (
                <>
                  <dt className="text-charcoal/50">Wood Type</dt>
                  <dd className="text-charcoal">{product.wood_type}</dd>
                </>
              )}
              {dims.length > 0 && (
                <>
                  <dt className="text-charcoal/50">Dimensions</dt>
                  <dd className="text-charcoal">
                    {dims.join(" × ")} {product.dimension_unit}
                  </dd>
                </>
              )}
              {product.weight && (
                <>
                  <dt className="text-charcoal/50">Weight</dt>
                  <dd className="text-charcoal">{product.weight} kg</dd>
                </>
              )}
            </dl>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-charcoal/10 pt-6">
              <h2 className="font-display text-lg text-charcoal">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-display-md text-charcoal">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
