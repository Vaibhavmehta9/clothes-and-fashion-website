import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import PageLoader from '@/components/ui/PageLoader';

// Layouts
const StorefrontLayout = lazy(() => import('@/layouts/StorefrontLayout'));
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const VendorLayout = lazy(() => import('@/layouts/VendorLayout'));
const AccountLayout = lazy(() => import('@/layouts/AccountLayout'));

// Storefront pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const BrandPage = lazy(() => import('@/pages/BrandPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const BlogsPage = lazy(() => import('@/pages/BlogsPage'));
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage'));
const VendorStorePage = lazy(() => import('@/pages/VendorStorePage'));
const CMSPage = lazy(() => import('@/pages/CMSPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Account pages
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'));
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'));
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'));
const CustomerSupportPage = lazy(() => import('@/pages/account/CustomerSupportPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));

// Vendor pages
const VendorDashboardPage = lazy(() => import('@/pages/vendor/DashboardPage'));
const VendorProductsPage = lazy(() => import('@/pages/vendor/ProductsPage'));
const VendorAddProductPage = lazy(() => import('@/pages/vendor/AddProductPage'));
const VendorOrdersPage = lazy(() => import('@/pages/vendor/OrdersPage'));
const VendorSettingsPage = lazy(() => import('@/pages/vendor/SettingsPage'));
const VendorAnalyticsPage = lazy(() => import('@/pages/vendor/AnalyticsPage'));
const VendorRegisterPage = lazy(() => import('@/pages/vendor/RegisterPage'));
const AdminConsolePage = lazy(() => import('@/pages/vendor/AdminConsolePage'));
const SupportTicketsPage = lazy(() => import('@/pages/vendor/SupportTicketsPage'));

// Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

const VendorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'vendor' && user?.role !== 'admin' && user?.role !== 'support') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default function App() {
  const { theme } = useUIStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---- STOREFRONT ---- */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/brand/:slug" element={<BrandPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogDetailPage />} />
          <Route path="/store/:slug" element={<VendorStorePage />} />
          <Route path="/pages/:slug" element={<CMSPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />

          {/* Protected Storefront Routes */}
          <Route element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
            <Route path="/account" element={<ProfilePage />} />
            <Route path="/account/orders" element={<OrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/account/notifications" element={<NotificationsPage />} />
            <Route path="/account/support" element={<CustomerSupportPage />} />
          </Route>

          <Route
            path="/checkout"
            element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
          />
        </Route>

        {/* ---- AUTH ---- */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ---- VENDOR DASHBOARD ---- */}
        <Route path="/vendor" element={<VendorRoute><VendorLayout /></VendorRoute>}>
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboardPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="products/add" element={<VendorAddProductPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="analytics" element={<VendorAnalyticsPage />} />
          <Route path="settings" element={<VendorSettingsPage />} />
          <Route path="admin-console" element={<AdminConsolePage />} />
          <Route path="support" element={<SupportTicketsPage />} />
        </Route>

        {/* Vendor registration (protected, not vendor-only) */}
        <Route
          path="/vendor/register"
          element={<ProtectedRoute><StorefrontLayout /></ProtectedRoute>}
        >
          <Route index element={<VendorRegisterPage />} />
        </Route>

        {/* ---- 404 ---- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
