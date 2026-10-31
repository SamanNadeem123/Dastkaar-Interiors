import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { ordersApi } from "../../services/orders";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState } from "../../components/ui/Feedback";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function AccountOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => ordersApi.getByNumber(orderNumber as string),
    enabled: !!orderNumber,
  });

  // Live status updates: join a room scoped to this order number so that if
  // an admin changes the status while this page is open, it updates without
  // a manual refresh - no admin data is ever exposed through this channel.
  useEffect(() => {
    if (!orderNumber) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("track_order", { order_number: orderNumber }));
    socket.on("order_status_update", (payload: { order_number: string; order_status: string }) => {
      if (payload.order_number === orderNumber) {
        queryClient.invalidateQueries({ queryKey: ["order", orderNumber] });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [orderNumber, queryClient]);

  if (isLoading) return <div className="container-editorial py-24 text-center text-charcoal/50">Loading...</div>;
  if (!order) return <EmptyState title="Order not found" />;

  const isCancelled = order.order_status === "cancelled";
  const currentStepIndex = STEPS.indexOf(order.order_status);

  return (
    <div className="container-editorial max-w-3xl py-12">
      <Link to="/account/orders" className="text-sm text-charcoal/50 hover:text-walnut">&larr; Back to Orders</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-display-md text-charcoal">{order.order_number}</h1>
        <p className="text-sm text-charcoal/50">{new Date(order.created_at).toLocaleDateString()}</p>
      </div>

      {!isCancelled ? (
        <div className="mt-8 flex items-center">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    i <= currentStepIndex ? "bg-walnut text-ivory-100" : "bg-sand-light text-charcoal/40"
                  }`}
                >
                  {i + 1}
                </div>
                <p className="mt-2 whitespace-nowrap text-[11px] capitalize text-charcoal/60">{step}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${i < currentStepIndex ? "bg-walnut" : "bg-sand-light"}`} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">This order was cancelled.</p>
      )}

      <div className="mt-10 rounded-card border border-charcoal/10 p-6">
        <h2 className="font-display text-lg text-charcoal">Items</h2>
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
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-charcoal/10 p-6 text-sm">
          <h3 className="font-semibold text-charcoal">Delivery Address</h3>
          <p className="mt-2 text-charcoal/70">{order.address}</p>
          <p className="text-charcoal/70">{order.city} {order.postal_code}</p>
        </div>
        <div className="rounded-card border border-charcoal/10 p-6 text-sm">
          <h3 className="font-semibold text-charcoal">Payment</h3>
          <p className="mt-2 uppercase text-charcoal/70">{order.payment_method}</p>
          <p className="capitalize text-charcoal/70">{order.payment_status}</p>
        </div>
      </div>
    </div>
  );
}
