import { Link } from "react-router-dom";
import { Package, FolderTree, ShoppingCart, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useAdminDashboardStats } from "../../hooks/useAdminData";
import { Spinner } from "../../components/ui/Feedback";
import { formatPKR } from "../../components/customer/ProductCard";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string | number }) {
  return (
    <div className="card-editorial p-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs uppercase tracking-wide text-charcoal/45">{label}</p>
        <Icon size={18} className="text-walnut" />
      </div>
      <p className="mt-3 font-display text-2xl text-charcoal">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Products" value={stats.total_products} />
        <StatCard icon={FolderTree} label="Categories" value={stats.total_categories} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.total_orders} />
        <StatCard icon={Users} label="Customers" value={stats.total_customers} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-editorial p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs uppercase tracking-wide text-charcoal/45">Total Sales (Paid)</p>
            <TrendingUp size={18} className="text-moss" />
          </div>
          <p className="mt-3 font-display text-2xl text-charcoal">{formatPKR(stats.total_sales)}</p>
        </div>
        <div className="card-editorial p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs uppercase tracking-wide text-charcoal/45">Low Stock</p>
            <AlertTriangle size={18} className="text-brass" />
          </div>
          <p className="mt-3 font-display text-2xl text-charcoal">{stats.low_stock_count}</p>
          <p className="mt-1 font-body text-xs text-charcoal/45">5 units or fewer remaining</p>
        </div>
        <div className="card-editorial p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs uppercase tracking-wide text-charcoal/45">Out of Stock</p>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="mt-3 font-display text-2xl text-charcoal">{stats.out_of_stock_count}</p>
        </div>
      </div>

      <div className="card-editorial p-6">
        <p className="font-display text-lg text-charcoal">Orders by Status</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(stats.orders_by_status).map(([status, count]) => (
            <div key={status} className="rounded-card bg-sand-light p-3 text-center">
              <p className="font-display text-lg text-charcoal">{count}</p>
              <p className="mt-0.5 font-body text-[11px] text-charcoal/50">{STATUS_LABELS[status] ?? status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-editorial p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-charcoal">Recent Orders</p>
            <Link to="/admin/orders" className="text-sm font-medium text-walnut hover:underline">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-charcoal/10">
            {stats.recent_orders.length === 0 && <p className="py-6 text-center text-sm text-charcoal/50">No orders yet.</p>}
            {stats.recent_orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between py-3 text-sm hover:text-walnut">
                <div>
                  <p className="font-medium text-charcoal">{o.order_number}</p>
                  <p className="text-xs text-charcoal/45">{o.customer_name}</p>
                </div>
                <span className="font-medium text-charcoal">{formatPKR(o.total)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-editorial p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-charcoal">Recent Products</p>
            <Link to="/admin/products" className="text-sm font-medium text-walnut hover:underline">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-charcoal/10">
            {stats.recent_products.length === 0 && <p className="py-6 text-center text-sm text-charcoal/50">No products yet.</p>}
            {stats.recent_products.map((p) => (
              <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="flex items-center justify-between py-3 text-sm hover:text-walnut">
                <span className="font-medium text-charcoal">{p.name}</span>
                <span className="text-charcoal/60">{formatPKR(p.sale_price ?? p.original_price)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
