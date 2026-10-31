import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { ordersApi } from "../../services/orders";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState } from "../../components/ui/Feedback";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

export default function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersApi.getByNumber(orderNumber as string),
    enabled: !!orderNumber,
  });

  if (isLoading) return <div className="container-editorial py-24 text-center text-charcoal/50">Loading...</div>;
  if (!order) return <EmptyState title="Order not found" />;

  return (
    <div className="container-editorial max-w-2xl py-16 text-center">
      <CheckCircle2 className="mx-auto text-moss" size={56} />
      <h1 className="mt-6 font-display text-display-md text-charcoal">Order Placed Successfully</h1>
      <p className="mt-2 text-charcoal/60">Thank you, {order.customer_name}. Your order has been received.</p>

      <div className="mt-8 rounded-card border border-charcoal/10 bg-sand-light/40 p-6 text-left">
        <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
          <div>
            <p className="text-xs text-charcoal/50">Order Number</p>
            <p className="font-display text-lg text-charcoal">{order.order_number}</p>
          </div>
          <span className="rounded-full bg-walnut/10 px-3 py-1 text-xs font-semibold text-walnut">
            {STATUS_LABEL[order.order_status]}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-charcoal/80">
                {item.product_name} {item.selected_color && `(${item.selected_color})`} × {item.quantity}
              </span>
              <span className="text-charcoal">{formatPKR(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4 text-sm">
          <div className="flex justify-between text-charcoal/70"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-moss"><span>Discount</span><span>−{formatPKR(order.discount)}</span></div>}
          <div className="flex justify-between text-charcoal/70"><span>Delivery Charges</span><span>{formatPKR(order.delivery_charge)}</span></div>
          <div className="flex justify-between border-t border-charcoal/10 pt-2 font-semibold text-charcoal"><span>Total</span><span>{formatPKR(order.total)}</span></div>
        </div>

        <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 text-sm text-charcoal/70">
          <span>Payment Method</span>
          <span className="uppercase text-charcoal">{order.payment_method}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to={`/account/orders/${order.order_number}`} className="btn-secondary">View Order</Link>
        <Link to="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
