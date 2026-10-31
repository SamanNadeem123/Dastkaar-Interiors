import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState } from "../../components/ui/Feedback";

export default function CartPage() {
  const { items, totals, updateQuantity, removeItem, isLoading } = useCart();

  if (isLoading) return <div className="container-editorial py-24 text-center text-charcoal/50">Loading your cart...</div>;

  if (items.length === 0) {
    return (
      <div className="container-editorial py-16">
        <EmptyState
          title="Your cart is empty"
          description="Browse our collections and add a piece you love."
          action={<Link to="/products" className="btn-primary">Continue Shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-editorial py-12">
      <h1 className="font-display text-display-md text-charcoal">Your Cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-charcoal/10 border-y border-charcoal/10">
          {items.map((item) => (
            <div key={item.key} className="flex gap-4 py-6">
              <Link to={item.slug ? `/products/${item.slug}` : "#"} className="h-24 w-24 shrink-0 overflow-hidden rounded-card bg-sand-light">
                {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-display text-base text-charcoal">{item.name}</p>
                    {item.color && <p className="mt-0.5 text-xs text-charcoal/50">Color: {item.color}</p>}
                    {item.stockQuantity <= 5 && item.stockQuantity > 0 && (
                      <p className="mt-0.5 text-xs text-brass">Only {item.stockQuantity} left</p>
                    )}
                  </div>
                  <button onClick={() => removeItem(item)} aria-label="Remove" className="h-fit text-charcoal/40 hover:text-red-600">
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-card border border-charcoal/20">
                    <button
                      onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                      className="px-2.5 py-1.5 text-charcoal/70"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item, Math.min(item.stockQuantity || 50, item.quantity + 1))}
                      className="px-2.5 py-1.5 text-charcoal/70"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-charcoal">{formatPKR(item.lineTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-card border border-charcoal/10 bg-sand-light/40 p-6">
          <h2 className="font-display text-lg text-charcoal">Order Summary</h2>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-charcoal/70">
              <span>Subtotal</span>
              <span>{formatPKR(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-moss">
                <span>Discount</span>
                <span>−{formatPKR(totals.discount)}</span>
              </div>
            )}
            <p className="text-xs text-charcoal/50">Delivery charges calculated at checkout</p>
          </div>
          <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 font-semibold text-charcoal">
            <span>Total</span>
            <span>{formatPKR(totals.total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            Proceed to Checkout
          </Link>
          <Link to="/products" className="btn-ghost mt-4 block text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
