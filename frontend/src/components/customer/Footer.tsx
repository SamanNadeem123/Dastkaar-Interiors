import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useStoreSettings } from "../../hooks/useCatalog";
import { useCategories } from "../../hooks/useCatalog";

// lucide-react no longer ships brand/social icons, so these are small
// inline SVGs matching the same 16px stroke-icon sizing used elsewhere.
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  const { data: settings } = useStoreSettings();
  const { data: categories } = useCategories();

  return (
    <footer className="border-t border-charcoal/10 bg-charcoal text-ivory-200">
      <div className="container-editorial grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-medium text-ivory-100">
            NA <span className="text-brass-light">Furniture Valley</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory-200/70">
            Furniture crafted for modern living — quality materials, honest craftsmanship, and pieces built to last.
          </p>
          <div className="mt-5 flex gap-3">
            {settings?.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-ivory-200/20 p-2 transition-colors hover:border-brass hover:text-brass-light"
              >
                <FacebookIcon size={16} />
              </a>
            )}
            {settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-ivory-200/20 p-2 transition-colors hover:border-brass hover:text-brass-light"
              >
                <InstagramIcon size={16} />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="font-body text-sm font-semibold text-ivory-100">Quick Links</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory-200/70">
            <li><Link to="/products" className="transition-colors hover:text-brass-light">Shop All</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-brass-light">About Us</Link></li>
            <li><Link to="/services" className="transition-colors hover:text-brass-light">Services</Link></li>
            <li><Link to="/gallery" className="transition-colors hover:text-brass-light">Gallery</Link></li>
            <li><Link to="/reviews" className="transition-colors hover:text-brass-light">Reviews</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-brass-light">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-body text-sm font-semibold text-ivory-100">Categories</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory-200/70">
            {(categories ?? []).slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className="transition-colors hover:text-brass-light">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-body text-sm font-semibold text-ivory-100">Visit or Reach Us</p>
          <ul className="mt-4 space-y-3 text-sm text-ivory-200/70">
            {settings?.address && (
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brass-light" /> {settings.address}
              </li>
            )}
            {settings?.phone && (
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-brass-light" /> {settings.phone}
              </li>
            )}
            {settings?.email && (
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-brass-light" /> {settings.email}
              </li>
            )}
            {settings?.opening_hours && (
              <li className="flex items-center gap-2.5">
                <Clock size={16} className="shrink-0 text-brass-light" /> {settings.opening_hours}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory-200/10">
        <div className="container-editorial flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory-200/50 sm:flex-row">
          <p>© {new Date().getFullYear()} NA Furniture Valley. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="transition-colors hover:text-ivory-200">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-ivory-200">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
