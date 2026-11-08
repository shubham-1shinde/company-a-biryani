import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import LoginPage from './pages/LoginPage';
import PartyOrderPage from './pages/PartyOrderPage';
import PartyOrderHistoryPage from './pages/PartyOrderHistoryPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminRepeatCustomersPage from './pages/admin/AdminRepeatCustomersPage';
import AdminOutletsPage from './pages/admin/AdminOutletsPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminPartyOrdersPage from './pages/admin/AdminPartyOrdersPage';
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import KitchenLoginPage from './pages/kitchen/KitchenLoginPage';
import CateringDashboardPage from './pages/catering/CateringDashboardPage';
import CompleteProfile from './pages/CompleteProfile';
import NotFoundPage from './pages/NotFoundPage';
import { loadUser } from './redux/authSlice';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, roles }) => {
  const { userData, loading } = useSelector(
    (state) => state.auth
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu/:outletSlug" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={['customer']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order/:orderId"
          element={
            <ProtectedRoute roles={['customer']}>
              <OrderStatusPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={['customer']}>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/party-order" 
          element={
            <PartyOrderPage />
          } 
        />

        <Route
          path="/party-orders"
          element={
            <ProtectedRoute roles={['customer']}>
              <PartyOrderHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminMenuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminRepeatCustomersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/outlets"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOutletsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/party-orders"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPartyOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen/login"
          element={<KitchenLoginPage />}
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['kitchen']}>
              <KitchenDisplayPage />
            </ProtectedRoute>
          }
        />

        <Route path="/catering" element={<Navigate to="/catering/dashboard" replace />} />
        <Route
          path="/catering/dashboard"
          element={
            <ProtectedRoute roles={['catering_manager']}>
              <CateringDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
