import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useAdminGallery, useAdminGalleryMutations } from "../../hooks/useAdminData";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

const CATEGORIES = ["Living Room", "Bedroom", "Dining", "Office", "Custom Furniture", "Showroom"];

export default function AdminGalleryPage() {
  const { data: images, isLoading } = useAdminGallery();
  const { upload, update, remove } = useAdminGalleryMutations();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    upload.mutate({ file, meta: { title: title || undefined, category } }, { onSuccess: () => setTitle("") });
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Gallery</h1>

      <div className="card-editorial mt-6 flex flex-wrap items-end gap-3 p-6">
        <div className="flex-1 min-w-[180px]">
          <label className="label-field">Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
        </div>
        <div className="w-48">
          <label className="label-field">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className="btn-primary cursor-pointer">
          <Upload size={16} /> Upload Image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
        </label>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-card bg-sand-light">
                <img src={img.image_url} alt={img.title ?? ""} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-charcoal/0 p-2 opacity-0 transition-opacity group-hover:bg-charcoal/40 group-hover:opacity-100">
                  <div className="flex justify-end">
                    <button onClick={() => remove.mutate(img.id)} className="rounded-full bg-ivory-100 p-1.5" aria-label="Delete">
                      <Trash2 size={13} className="text-red-600" />
                    </button>
                  </div>
                  <button
                    onClick={() => update.mutate({ id: img.id, payload: { is_active: !img.is_active } })}
                    className="rounded-full bg-ivory-100 px-2 py-1 text-[11px] font-medium text-charcoal"
                  >
                    {img.is_active ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No gallery images yet" description="Upload photos from the showroom or finished projects." />
        )}
      </div>
    </div>
  );
}
