import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import GuestLayout from '@/components/layout/GuestLayout';
import AuthGuard from '@/components/layout/AuthGuard';
import GuestGuard from '@/components/layout/GuestGuard';

import HomePage from '@/pages/HomePage';
import RestaurantDetailPage from '@/pages/RestaurantDetailPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ReservationsPage from '@/pages/ReservationsPage';
import ProfilePage from '@/pages/ProfilePage';
import RestaurantCreatePage from '@/pages/RestaurantCreatePage';
import RestaurantEditPage from '@/pages/RestaurantEditPage';
import OwnerDashboardPage from '@/pages/OwnerDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import MyPage from '@/pages/MyPage';
import ReviewCreatePage from '@/pages/ReviewCreatePage';
import MyReviewsPage from '@/pages/MyReviewsPage';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Guest-only routes */}
            <Route element={<GuestGuard />}>
              <Route element={<GuestLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              </Route>
            </Route>

            {/* Main layout routes */}
            <Route element={<AppLayout />}>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/restaurants" element={<HomePage />} />
              <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />

              {/* Auth required */}
              <Route element={<AuthGuard />}>
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/mypage/reviews" element={<MyReviewsPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/restaurants/:id/reviews/create" element={<ReviewCreatePage />} />
              </Route>

              {/* Owner only */}
              <Route element={<AuthGuard requiredRole={2} />}>
                <Route path="/restaurants/create" element={<RestaurantCreatePage />} />
                <Route path="/restaurants/:id/edit" element={<RestaurantEditPage />} />
                <Route path="/owner/restaurants/:id/dashboard" element={<OwnerDashboardPage />} />
              </Route>

              {/* Admin only */}
              <Route element={<AuthGuard requiredRole={3} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const container = document.getElementById('app');
if (container) {
  createRoot(container).render(<App />);
}
