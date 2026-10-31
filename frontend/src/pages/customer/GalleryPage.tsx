import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { galleryApi } from "../../services/misc";
import { EmptyState } from "../../components/ui/Feedback";

const CATEGORIES = ["All", "Living Room", "Bedroom", "Dining", "Office", "Custom Furniture", "Showroom"];

export default function GalleryPage() {
  const [active, setActive] = useState("All");
  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery", active],
    queryFn: () => galleryApi.list(active === "All" ? undefined : active),
  });

  return (
    <div className="container-editorial py-16 lg:py-24">
      <p className="section-eyebrow">Gallery</p>
      <h1 className="mt-4 max-w-2xl font-display text-display-lg text-charcoal">Rooms we've helped furnish</h1>

      <div className="mt-10 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active === cat
                ? "border-walnut bg-walnut text-ivory-100"
                : "border-charcoal/15 text-charcoal/70 hover:border-charcoal/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-card bg-sand-light" />
            ))}
          </div>
        ) : images && images.length > 0 ? (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {images.map((img) => (
              <figure key={img.id} className="break-inside-avoid overflow-hidden rounded-card">
                <img src={img.image_url} alt={img.title ?? "Gallery image"} loading="lazy" className="w-full object-cover" />
                {img.title && (
                  <figcaption className="mt-1.5 font-body text-xs text-charcoal/50">{img.title}</figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState title="No images yet" description="Check back soon — we're adding new photos from our showroom." />
        )}
      </div>
    </div>
  );
}
