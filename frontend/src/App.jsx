import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import KitchenLoginPage from './pages/kitchen/KitchenLoginPage';
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
        <Route path="/login" element={<LoginPage />} />

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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
