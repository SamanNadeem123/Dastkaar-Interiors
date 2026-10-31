import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { reviewsApi } from "../../services/misc";
import { apiErrorMessage } from "../../services/api";
import { EmptyState, Spinner } from "../../components/ui/Feedback";
import { useAuthStore } from "../../store/authStore";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star size={18} className={n <= value ? "fill-brass text-brass" : "text-charcoal/20"} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["reviews", "all"], queryFn: () => reviewsApi.list(undefined, 1, 20) });

  const [rating, setRating] = useState(5);
  const [name, setName] = useState(user?.full_name ?? "");
  const [comment, setComment] = useState("");

  const submitMutation = useMutation({
    mutationFn: reviewsApi.submit,
    onSuccess: (review) => {
      toast.success(review ? "Thank you! Your review will appear once approved." : "Submitted");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    submitMutation.mutate({ customer_name: name.trim(), rating, comment: comment.trim() || undefined });
  }

  return (
    <div className="container-editorial py-16 lg:py-24">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="section-eyebrow">Customer Reviews</p>
          <h1 className="mt-4 font-display text-display-lg text-charcoal">What customers are saying</h1>

          <div className="mt-10 space-y-8">
            {isLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : data && data.items.length > 0 ? (
              data.items.map((r) => (
                <div key={r.id} className="border-b border-charcoal/10 pb-8">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base text-charcoal">{r.customer_name}</p>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2.5 font-body text-sm leading-relaxed text-charcoal/70">{r.comment}</p>}
                  <p className="mt-2 font-body text-xs text-charcoal/40">
                    {new Date(r.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No reviews yet" description="Be the first to share your experience." />
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="card-editorial sticky top-24 p-7">
            <h2 className="font-display text-xl text-charcoal">Leave a review</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label-field">Your rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="label-field" htmlFor="review-name">Your name</label>
                <input id="review-name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label-field" htmlFor="review-comment">Your review</label>
                <textarea
                  id="review-comment"
                  className="input-field min-h-[100px] resize-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                />
              </div>
              <button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full">
                {submitMutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
              <p className="font-body text-xs text-charcoal/45">
                Reviews are checked by our team before appearing publicly.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
