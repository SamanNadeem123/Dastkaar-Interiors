import type { ReactNode } from "react";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-card bg-sand-light" />
          <div className="mt-3.5 h-3 w-1/3 rounded bg-sand-light" />
          <div className="mt-2 h-4 w-2/3 rounded bg-sand-light" />
          <div className="mt-2 h-4 w-1/4 rounded bg-sand-light" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="font-display text-xl text-charcoal">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-charcoal/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-charcoal/20 border-t-walnut"
      style={{ width: size, height: size }}
    />
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="mt-12 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-card border border-charcoal/15 px-3 py-2 text-sm text-charcoal disabled:opacity-30"
      >
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-charcoal/30">…</span>}
          <button
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-card text-sm transition-colors ${
              p === page ? "bg-walnut text-ivory-100" : "text-charcoal hover:bg-sand-light"
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-card border border-charcoal/15 px-3 py-2 text-sm text-charcoal disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
