import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/** Guards customer-only routes like /account/*. Unauthenticated visitors are
 * redirected to /login and returned here afterwards. */
export function RequireCustomerAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

/** Guards every /admin/* route except /admin/login and /admin/signup.
 * Enforced here for UX only - the backend independently rejects non-admin
 * tokens with 403 on every /api/admin/* call, which is the real boundary. */
export function RequireAdminAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
