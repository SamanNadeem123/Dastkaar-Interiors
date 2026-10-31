import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Spinner } from "./components/ui/Feedback";
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";
import { RequireCustomerAuth, RequireAdminAuth } from "./routes/guards";

// Customer pages
const HomePage = lazy(() => import("./pages/customer/HomePage"));
const ProductsPage = lazy(() => import("./pages/customer/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/customer/ProductDetailPage"));
const CategoryPage = lazy(() => import("./pages/customer/CategoryPage"));
const CartPage = lazy(() => import("./pages/customer/CartPage"));
const CheckoutPage = lazy(() => import("./pages/customer/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/customer/OrderSuccessPage"));
const LoginPage = lazy(() => import("./pages/customer/LoginPage"));
const RegisterPage = lazy(() => import("./pages/customer/RegisterPage"));
const AccountProfilePage = lazy(() => import("./pages/customer/AccountProfilePage"));
const AccountOrdersPage = lazy(() => import("./pages/customer/AccountOrdersPage"));
const AccountOrderDetailPage = lazy(() => import("./pages/customer/AccountOrderDetailPage"));
const AboutPage = lazy(() => import("./pages/customer/AboutPage"));
const ServicesPage = lazy(() => import("./pages/customer/ServicesPage"));
const GalleryPage = lazy(() => import("./pages/customer/GalleryPage"));
const ContactPage = lazy(() => import("./pages/customer/ContactPage"));
const ReviewsPage = lazy(() => import("./pages/customer/ReviewsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/customer/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/customer/TermsPage"));
const NotFoundPage = lazy(() => import("./pages/customer/NotFoundPage"));

// Admin pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminSignupPage = lazy(() => import("./pages/admin/AdminSignupPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductFormPage = lazy(() => import("./pages/admin/AdminProductFormPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminDeliveryPage = lazy(() => import("./pages/admin/AdminDeliveryPage"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminGalleryPage = lazy(() => import("./pages/admin/AdminGalleryPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Customer storefront */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route element={<RequireCustomerAuth />}>
            <Route path="/account" element={<AccountProfilePage />} />
            <Route path="/account/profile" element={<AccountProfilePage />} />
            <Route path="/account/orders" element={<AccountOrdersPage />} />
            <Route path="/account/orders/:orderNumber" element={<AccountOrderDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />

        <Route element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/new" element={<AdminProductFormPage />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/gallery" element={<AdminGalleryPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
