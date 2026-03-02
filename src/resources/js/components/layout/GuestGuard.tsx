import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function GuestGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner className="py-20" />;

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
