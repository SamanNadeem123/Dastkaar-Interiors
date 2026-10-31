import { useState } from "react";
import { Search } from "lucide-react";
import { useAdminCustomers } from "../../hooks/useAdminData";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminCustomers(search, 1);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Customers</h1>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="input-field pl-9" />
      </div>

      <div className="mt-6 card-editorial overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {data.items.map((c) => (
                <tr key={c.id} className="hover:bg-sand-light/40">
                  <td className="px-5 py-3 font-medium text-charcoal">{c.full_name}</td>
                  <td className="px-5 py-3 text-charcoal/70">{c.email}</td>
                  <td className="px-5 py-3 text-charcoal/70">{c.phone}</td>
                  <td className="px-5 py-3 text-charcoal/60">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-charcoal/70">{c.orders_count ?? 0}</td>
                  <td className="px-5 py-3 font-medium text-charcoal">{formatPKR(c.total_spent ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No customers found" />
        )}
      </div>
    </div>
  );
}
