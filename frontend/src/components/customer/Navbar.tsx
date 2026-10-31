import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useCart } from "../../hooks/useCart";
import { useCategories, useStoreSettings } from "../../hooks/useCatalog";

const DEFAULT_STORE_NAME = import.meta.env.VITE_STORE_NAME || "NA Furniture Valley";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { itemCount } = useCart();
  const { data: categories } = useCategories();
  const { data: settings } = useStoreSettings();
  const storeName = settings?.store_name || DEFAULT_STORE_NAME;
  const [brandFirst, ...brandRest] = storeName.split(" ");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm("");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory-100/90 backdrop-blur-md">
      <div className="container-editorial flex h-20 items-center justify-between gap-6">
        <Link to="/" className="shrink-0 font-display text-2xl font-medium tracking-tight text-charcoal">
          {brandFirst} <span className="text-walnut">{brandRest.join(" ")}</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <Link to="/" className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">
            Home
          </Link>
          <Link to="/products" className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">
            Shop
          </Link>
          <div className="group relative">
            <button className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">Categories</button>
            <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="card-editorial bg-ivory-100 p-2 shadow-lift">
                {(categories ?? []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="block rounded px-3 py-2 text-sm text-charcoal/80 transition-colors hover:bg-sand-light hover:text-walnut"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link to="/gallery" className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">
            Gallery
          </Link>
          <Link to="/about" className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">
            About
          </Link>
          <Link to="/contact" className="text-sm font-medium text-charcoal/80 transition-colors hover:text-walnut">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-2 text-charcoal/80 transition-colors hover:bg-sand-light hover:text-walnut"
          >
            <Search size={20} />
          </button>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative rounded-full p-2 text-charcoal/80 transition-colors hover:bg-sand-light hover:text-walnut"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-walnut text-[10px] font-semibold text-ivory-100">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            aria-label={isAuthenticated ? "Account" : "Login"}
            className="hidden rounded-full p-2 text-charcoal/80 transition-colors hover:bg-sand-light hover:text-walnut sm:block"
          >
            <User size={20} />
          </Link>
          {isAuthenticated && (
            <span className="hidden text-sm text-charcoal/60 md:block">Hi, {user?.full_name.split(" ")[0]}</span>
          )}
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-charcoal/80 hover:bg-sand-light lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-charcoal/10 bg-ivory-100 px-6 py-4">
          <form onSubmit={submitSearch} className="container-editorial flex gap-3">
            <input
              autoFocus
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sofas, dining tables, wood type..."
              className="input-field"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-charcoal/10 bg-ivory-100 px-6 py-4 lg:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)} className="rounded px-2 py-3 text-charcoal hover:bg-sand-light">
            Home
          </Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="rounded px-2 py-3 text-charcoal hover:bg-sand-light">
            Shop
          </Link>
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-3 pl-6 text-sm text-charcoal/70 hover:bg-sand-light"
            >
              {c.name}
            </Link>
          ))}
          <Link to="/gallery" onClick={() => setMenuOpen(false)} className="rounded px-2 py-3 text-charcoal hover:bg-sand-light">
            Gallery
          </Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded px-2 py-3 text-charcoal hover:bg-sand-light">
            About
          </Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className="rounded px-2 py-3 text-charcoal hover:bg-sand-light">
            Contact
          </Link>
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            onClick={() => setMenuOpen(false)}
            className="rounded px-2 py-3 text-charcoal hover:bg-sand-light"
          >
            {isAuthenticated ? "My Account" : "Login / Register"}
          </Link>
        </nav>
      )}
    </header>
  );
}
