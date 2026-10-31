import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";
import { useAuthStore } from "../../store/authStore";
import { useDeliveryQuote } from "../../hooks/useCatalog";
import { ordersApi } from "../../services/orders";
import { apiErrorMessage } from "../../services/api";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState } from "../../components/ui/Feedback";

const checkoutSchema = z.object({
  customer_name: z.string().min(2, "Full name is required"),
  customer_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  customer_phone: z.string().min(7, "Enter a valid phone number"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().optional(),
  payment_method: z.enum(["cod", "card"]),
  save_address: z.boolean().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function generateIdempotencyKey() {
  return `nafv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totals } = useCart();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: user?.full_name ?? "",
      customer_email: user?.email ?? "",
      customer_phone: user?.phone ?? "",
      payment_method: "cod",
      save_address: true,
    },
  });

  const city = watch("city");
  const { data: deliveryCharge = 0, isFetching: quoteLoading } = useDeliveryQuote(city || "");
  const paymentMethod = watch("payment_method");

  // Autofill saved address for logged-in customers
  useEffect(() => {
    if (!isAuthenticated) return;
    ordersApi.getDefaultAddress().then((address) => {
      if (address) {
        setValue("address", address.address_line);
        setValue("city", address.city);
        setValue("postal_code", address.postal_code ?? "");
        setValue("customer_phone", address.phone);
        setValue("customer_name", address.full_name);
      }
    }).catch(() => {});
  }, [isAuthenticated, setValue]);

  if (items.length === 0) {
    return (
      <div className="container-editorial py-16">
        <EmptyState title="Your cart is empty" description="Add something to your cart before checking out." action={<Link to="/products" className="btn-primary">Shop Now</Link>} />
      </div>
    );
  }

  const grandTotal = totals.total + (deliveryCharge || 0);

  async function onSubmit(data: CheckoutForm) {
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        ...data,
        customer_email: data.customer_email || undefined,
        idempotency_key: idempotencyKey,
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity, selected_color: i.color })),
      });

      if (data.payment_method === "card") {
        try {
          const { paymentsApi } = await import("../../services/misc");
          await paymentsApi.sandboxConfirm(order.order_number, "success");
        } catch {
          // Sandbox confirmation failing shouldn't block the customer from seeing their order.
        }
      }

      navigate(`/order-success/${order.order_number}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not place your order. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <div className="container-editorial py-12">
      <h1 className="font-display text-display-md text-charcoal">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-lg text-charcoal">Customer Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label-field">Full Name</label>
                <input {...register("customer_name")} className="input-field" placeholder="Ali Ahmed" />
                {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>}
              </div>
              <div>
                <label className="label-field">Phone Number</label>
                <input {...register("customer_phone")} className="input-field" placeholder="03XX-XXXXXXX" />
                {errors.customer_phone && <p className="mt-1 text-xs text-red-600">{errors.customer_phone.message}</p>}
              </div>
              <div>
                <label className="label-field">Email (optional)</label>
                <input {...register("customer_email")} className="input-field" placeholder="you@example.com" />
                {errors.customer_email && <p className="mt-1 text-xs text-red-600">{errors.customer_email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Address</label>
                <input {...register("address")} className="input-field" placeholder="House #, Street, Area" />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
              </div>
              <div>
                <label className="label-field">City</label>
                <input {...register("city")} className="input-field" placeholder="Lahore" />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="label-field">Postal Code (optional)</label>
                <input {...register("postal_code")} className="input-field" placeholder="54000" />
              </div>
            </div>
            {isAuthenticated && (
              <label className="mt-4 flex items-center gap-2 text-sm text-charcoal/70">
                <input type="checkbox" {...register("save_address")} className="h-4 w-4 rounded border-charcoal/30 text-walnut" />
                Save this address to my account
              </label>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg text-charcoal">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors ${
                  paymentMethod === "cod" ? "border-walnut bg-walnut/5" : "border-charcoal/15"
                }`}
              >
                <input type="radio" value="cod" {...register("payment_method")} className="h-4 w-4 text-walnut" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">Cash on Delivery</p>
                  <p className="text-xs text-charcoal/50">Pay when your order arrives</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors ${
                  paymentMethod === "card" ? "border-walnut bg-walnut/5" : "border-charcoal/15"
                }`}
              >
                <input type="radio" value="card" {...register("payment_method")} className="h-4 w-4 text-walnut" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">Card Payment</p>
                  <p className="text-xs text-charcoal/50">Secure sandbox payment for this demo environment</p>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="h-fit rounded-card border border-charcoal/10 bg-sand-light/40 p-6">
          <h2 className="font-display text-lg text-charcoal">Order Summary</h2>
          <div className="mt-4 max-h-56 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <div key={item.key} className="flex gap-3 text-sm">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-sand">
                  {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-charcoal">{item.name}</p>
                  <p className="text-xs text-charcoal/50">
                    {item.color && `${item.color} · `}Qty {item.quantity}
                  </p>
                </div>
                <p className="text-charcoal">{formatPKR(item.lineTotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4 text-sm">
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
            <div className="flex justify-between text-charcoal/70">
              <span>Delivery Charges</span>
              <span>{city ? (quoteLoading ? "…" : formatPKR(deliveryCharge)) : "Enter city"}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 font-semibold text-charcoal">
            <span>Total</span>
            <span>{formatPKR(grandTotal)}</span>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
