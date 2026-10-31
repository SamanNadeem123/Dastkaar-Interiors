import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAdminOrders } from "../../hooks/useAdminData";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState, Spinner, Pagination } from "../../components/ui/Feedback";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-brass/15 text-brass",
  confirmed: "bg-moss/15 text-moss",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-moss/20 text-moss",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const { data, isLoading } = useAdminOrders({
    page, limit: 20,
    search: search || undefined,
    status: status || undefined,
    payment_status: paymentStatus || undefined,
    payment_method: paymentMethod || undefined,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Order number, name, or phone..." className="input-field pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Payment Status</option>
          {["pending", "paid", "failed", "refunded"].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Methods</option>
          <option value="cod">Cash on Delivery</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div className="mt-6 card-editorial overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {data.items.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-sand-light/40">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-walnut hover:underline">{o.order_number}</Link>
                  </td>
                  <td className="px-5 py-3 text-charcoal">{o.customer_name}</td>
                  <td className="px-5 py-3 text-charcoal/60">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-medium text-charcoal">{formatPKR(o.total)}</td>
                  <td className="px-5 py-3">
                    <span className="text-charcoal/70">{o.payment_method === "cod" ? "COD" : "Card"}</span>
                    <span className="ml-1.5 text-xs text-charcoal/40">({o.payment_status})</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[o.order_status]}`}>
                      {o.order_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No orders found" description="Orders will appear here as customers check out." />
        )}
      </div>

      {data && <Pagination page={page} totalPages={data.total_pages} onChange={setPage} />}
    </div>
  );
}
