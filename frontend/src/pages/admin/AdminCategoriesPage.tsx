import { useState } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { useAdminCategories, useAdminCategoryMutations } from "../../hooks/useAdminData";
import { EmptyState, Spinner } from "../../components/ui/Feedback";
import type { Category } from "../../types";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const { create, update, uploadImage, remove } = useAdminCategoryMutations();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? "");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      update.mutate({ id: editing.id, payload: { name, description } }, { onSuccess: () => setShowForm(false) });
    } else {
      create.mutate({ name, description }, { onSuccess: () => setShowForm(false) });
    }
  }

  function handleImageChange(catId: number, file: File | undefined) {
    if (file) uploadImage.mutate({ id: catId, file });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Categories</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-editorial mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">{editing ? "Edit Category" : "New Category"}</h2>
          <div>
            <label className="label-field">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? "Save Changes" : "Create Category"}</button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="card-editorial overflow-hidden">
                <div className="relative aspect-[16/9] bg-sand-light">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-charcoal/30"><ImageIcon size={28} /></div>
                  )}
                  <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-ivory-100/90 px-2.5 py-1 text-xs font-medium text-charcoal shadow-soft">
                    Change
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(cat.id, e.target.files?.[0])} />
                  </label>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base text-charcoal">{cat.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.is_active ? "bg-moss/10 text-moss" : "bg-charcoal/10 text-charcoal/50"}`}>
                      {cat.is_active ? "Active" : "Archived"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-charcoal/45">{cat.product_count ?? 0} product(s)</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => openEdit(cat)} className="btn-secondary flex-1 py-2 text-xs">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => remove.mutate(cat.id)} className="rounded-card border border-charcoal/20 px-3 py-2 text-charcoal/60 hover:border-red-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No categories yet" description="Add your first category to start organizing products." />
        )}
      </div>
    </div>
  );
}
