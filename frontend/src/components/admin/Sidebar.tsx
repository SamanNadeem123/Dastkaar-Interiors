import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Truck,
  Star,
  Image,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, showBadge: true },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/delivery", label: "Delivery", icon: Truck },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const { unreadCount } = useAdminNotifications();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-charcoal/10 bg-charcoal text-ivory-200 lg:flex">
      <div className="flex h-20 items-center border-b border-ivory-200/10 px-6">
        <span className="font-display text-lg font-medium text-ivory-100">
          NA <span className="text-brass-light">Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map(({ to, label, icon: Icon, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-walnut text-ivory-100" : "text-ivory-200/70 hover:bg-ivory-200/10 hover:text-ivory-100"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
            {showBadge && unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ivory-200/10 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-200/70 transition-colors hover:bg-ivory-200/10 hover:text-ivory-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
