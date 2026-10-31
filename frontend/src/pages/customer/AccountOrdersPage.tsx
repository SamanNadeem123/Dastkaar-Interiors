import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../../services/orders";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState, Pagination } from "../../components/ui/Feedback";
import AccountTabs from "../../components/customer/AccountTabs";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-brass/10 text-brass",
  confirmed: "bg-walnut/10 text-walnut",
  processing: "bg-walnut/10 text-walnut",
  shipped: "bg-moss/10 text-moss",
  delivered: "bg-moss/10 text-moss",
  cancelled: "bg-red-100 text-red-600",
};

export default function AccountOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: () => ordersApi.myOrders(page, 10),
  });

  return (
    <div className="container-editorial py-12">
      <h1 className="font-display text-display-md text-charcoal">My Account</h1>
      <AccountTabs />

      {isLoading ? (
        <p className="text-charcoal/50">Loading orders...</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No orders yet" description="Once you place an order, it will show up here." action={<Link to="/products" className="btn-primary">Shop Now</Link>} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-charcoal/10">
            <table className="w-full text-sm">
              <thead className="bg-sand-light/50 text-left text-xs uppercase tracking-wide text-charcoal/50">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/10">
                {data?.items.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-charcoal">{o.order_number}</td>
                    <td className="px-4 py-3 text-charcoal/70">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-charcoal">{formatPKR(o.total)}</td>
                    <td className="px-4 py-3 uppercase text-charcoal/70">{o.payment_method}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[o.order_status]}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/account/orders/${o.order_number}`} className="text-sm font-medium text-walnut hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && <Pagination page={data.page} totalPages={data.total_pages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
