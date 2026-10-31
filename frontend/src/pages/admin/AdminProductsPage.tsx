import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Archive, RotateCcw } from "lucide-react";
import { useAdminProducts, useAdminProductMutations } from "../../hooks/useAdminData";
import { useAdminCategories } from "../../hooks/useAdminData";
import { formatPKR } from "../../components/customer/ProductCard";
import { EmptyState, Spinner, Pagination } from "../../components/ui/Feedback";
import { adminProductsApi } from "../../services/admin";
import toast from "react-hot-toast";
import { apiErrorMessage } from "../../services/api";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 20,
    search: search || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    status: (status as "active" | "inactive") || undefined,
  });
  const { data: categories } = useAdminCategories();
  const { archive } = useAdminProductMutations();

  async function handleRestore(id: number) {
    try {
      await adminProductsApi.restore(id);
      toast.success("Product restored");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or SKU..."
            className="input-field pl-9"
          />
        </div>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Archived</option>
        </select>
      </div>

      <div className="mt-6 card-editorial overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-sand-light/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-sand-light">
                        {p.images[0] && <img src={p.images[0].image_url} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">{p.name}</p>
                        <p className="text-xs text-charcoal/45">{p.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-charcoal/70">{p.sku}</td>
                  <td className="px-5 py-3 text-charcoal">{formatPKR(p.sale_price ?? p.original_price)}</td>
                  <td className="px-5 py-3 text-charcoal/70">{p.stock_quantity}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.is_active ? "bg-moss/10 text-moss" : "bg-charcoal/10 text-charcoal/50"}`}>
                      {p.is_active ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/products/${p.id}/edit`} className="rounded-lg p-2 text-charcoal/60 hover:bg-sand-light hover:text-walnut" aria-label="Edit">
                        <Pencil size={16} />
                      </Link>
                      {p.is_active ? (
                        <button onClick={() => archive.mutate(p.id)} className="rounded-lg p-2 text-charcoal/60 hover:bg-sand-light hover:text-red-500" aria-label="Archive">
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(p.id)} className="rounded-lg p-2 text-charcoal/60 hover:bg-sand-light hover:text-moss" aria-label="Restore">
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No products found" description="Try adjusting your filters, or add your first product." />
        )}
      </div>

      {data && <Pagination page={page} totalPages={data.total_pages} onChange={setPage} />}
    </div>
  );
}
