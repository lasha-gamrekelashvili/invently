import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { isOnSubdomain } from './utils/api';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Settings from './pages/Settings';
import BulkUpload from './pages/BulkUpload';
import Storefront from './pages/Storefront';
import ProductDetail from './pages/ProductDetail';
import CheckoutPage from './pages/CheckoutPage';
import PlatformAdmin from './pages/PlatformAdmin';
import LegalPage from './pages/LegalPage';

const AppRoutes = () => {
  const { isLoading, user } = useAuth();
  const { language } = useLanguage();
  const onSubdomain = isOnSubdomain();

  // Set HTML lang attribute dynamically based on current language
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Subdomains should be accessible to the public - no redirect needed

  // Main domain - landing page + login/register
  if (!onSubdomain) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Legal Pages */}
        <Route path="/about" element={<LegalPage />} />
        <Route path="/contact" element={<LegalPage />} />
        <Route path="/services" element={<LegalPage />} />
        <Route path="/pricing" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/refund-policy" element={<LegalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Subdomain - public storefront + admin dashboard
  return (
    <Routes>
      {/* Public Storefront Routes */}
      <Route path="/" element={<Storefront />} />
      <Route path="/store" element={<Storefront />} />
      <Route path="/category/*" element={<Storefront />} />
      <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="bulk-upload" element={<BulkUpload />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="settings" element={<Settings />} />

        {/* Platform Admin Routes */}
        {user?.role === 'PLATFORM_ADMIN' && (
          <Route path="platform" element={<PlatformAdmin />} />
        )}
      </Route>

      {/* Catch-all route for subdomain */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="min-h-screen">
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;