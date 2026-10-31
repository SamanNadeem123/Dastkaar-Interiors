import { useState } from "react";
import { Check, X, Trash2, Star } from "lucide-react";
import { useAdminReviews, useAdminReviewMutations } from "../../hooks/useAdminData";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

const TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<string>("pending");
  const { data, isLoading } = useAdminReviews(tab || undefined);
  const { moderate, remove } = useAdminReviewMutations();

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Reviews</h1>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              tab === t.value ? "border-walnut bg-walnut text-ivory-100" : "border-charcoal/15 text-charcoal/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : data && data.items.length > 0 ? (
          <div className="space-y-3">
            {data.items.map((r) => (
              <div key={r.id} className="card-editorial flex items-start justify-between gap-4 p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-charcoal">{r.customer_name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? "fill-brass text-brass" : "text-charcoal/20"} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-charcoal/70">{r.comment}</p>}
                  <p className="mt-1.5 text-xs text-charcoal/40">{new Date(r.created_at).toLocaleDateString()} · {r.status}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status !== "approved" && (
                    <button onClick={() => moderate.mutate({ id: r.id, status: "approved" })} className="rounded-lg bg-moss/10 p-2 text-moss hover:bg-moss/20" aria-label="Approve">
                      <Check size={15} />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => moderate.mutate({ id: r.id, status: "rejected" })} className="rounded-lg bg-charcoal/10 p-2 text-charcoal/60 hover:bg-charcoal/20" aria-label="Reject">
                      <X size={15} />
                    </button>
                  )}
                  <button onClick={() => remove.mutate(r.id)} className="rounded-lg p-2 text-charcoal/60 hover:bg-red-50 hover:text-red-500" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No reviews here" />
        )}
      </div>
    </div>
  );
}
