import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAdminOrder, useAdminOrderMutations } from "../../hooks/useAdminData";
import { formatPKR } from "../../components/customer/ProductCard";
import { Spinner } from "../../components/ui/Feedback";
import type { OrderStatus } from "../../types";

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(Number(id));
  const { updateStatus } = useAdminOrderMutations();

  if (isLoading || !order) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }

  const isTerminal = TERMINAL_STATUSES.includes(order.order_status);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-walnut">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-charcoal">{order.order_number}</h1>
          <p className="mt-1 text-sm text-charcoal/50">Placed {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.order_status}
            disabled={isTerminal}
            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
            className="input-field w-auto disabled:opacity-50"
          >
            {STATUS_FLOW.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      {isTerminal && (
        <p className="mt-2 text-xs text-charcoal/45">
          This order is {order.order_status} and its status can no longer be changed.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-editorial p-6">
            <h2 className="font-display text-lg text-charcoal">Items</h2>
            <div className="mt-4 divide-y divide-charcoal/10">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-sand-light">
                    {item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                    <p className="text-xs text-charcoal/50">
                      {item.selected_color && `${item.selected_color} · `}Qty {item.quantity} × {formatPKR(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-charcoal">{formatPKR(item.line_total)}</p>
                </div>
              ))}
            </div>
          </div>

          {order.status_history && order.status_history.length > 0 && (
            <div className="card-editorial p-6">
              <h2 className="font-display text-lg text-charcoal">Status History</h2>
              <div className="mt-4 space-y-3">
                {order.status_history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <p className="text-charcoal">
                      <span className="capitalize text-charcoal/50">{h.old_status}</span> → <span className="font-medium capitalize">{h.new_status}</span>
                    </p>
                    <p className="text-xs text-charcoal/40">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-editorial p-6">
            <h2 className="font-display text-lg text-charcoal">Customer</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-charcoal/45">Name</dt><dd className="text-charcoal">{order.customer_name}</dd></div>
              <div><dt className="text-charcoal/45">Phone</dt><dd className="text-charcoal">{order.customer_phone}</dd></div>
              {order.customer_email && <div><dt className="text-charcoal/45">Email</dt><dd className="text-charcoal">{order.customer_email}</dd></div>}
              <div><dt className="text-charcoal/45">Address</dt><dd className="text-charcoal">{order.address}, {order.city} {order.postal_code}</dd></div>
            </dl>
          </div>

          <div className="card-editorial p-6">
            <h2 className="font-display text-lg text-charcoal">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-charcoal/45">Method</dt><dd className="text-charcoal">{order.payment_method === "cod" ? "Cash on Delivery" : "Card"}</dd></div>
              <div><dt className="text-charcoal/45">Status</dt><dd className="capitalize text-charcoal">{order.payment_status}</dd></div>
              {order.payments?.[0]?.transaction_id && (
                <div><dt className="text-charcoal/45">Transaction ID</dt><dd className="text-charcoal">{order.payments[0].transaction_id}</dd></div>
              )}
            </dl>
          </div>

          <div className="card-editorial p-6">
            <h2 className="font-display text-lg text-charcoal">Total</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-charcoal/60">Subtotal</dt><dd className="text-charcoal">{formatPKR(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-charcoal/60">Discount</dt><dd className="text-charcoal">-{formatPKR(order.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-charcoal/60">Delivery</dt><dd className="text-charcoal">{formatPKR(order.delivery_charge)}</dd></div>
              <div className="flex justify-between border-t border-charcoal/10 pt-2 font-semibold"><dt className="text-charcoal">Total</dt><dd className="text-charcoal">{formatPKR(order.total)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
