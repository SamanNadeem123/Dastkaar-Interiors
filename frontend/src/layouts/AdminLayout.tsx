import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/Sidebar";
import AdminTopbar from "../components/admin/Topbar";

const TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/delivery": "Delivery Zones",
  "/admin/reviews": "Reviews",
  "/admin/gallery": "Gallery",
  "/admin/settings": "Store Settings",
};

function resolveTitle(pathname: string) {
  const match = Object.keys(TITLES).find((key) => pathname === key || pathname.startsWith(key + "/"));
  return match ? TITLES[match] : "NA Furniture Valley Admin";
}

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-sand-light/40">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminTopbar title={resolveTitle(location.pathname)} />
        <main className="px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
