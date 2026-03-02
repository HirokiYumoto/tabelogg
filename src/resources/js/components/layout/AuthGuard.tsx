import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

interface AuthGuardProps {
  requiredRole?: number;
}

export default function AuthGuard({ requiredRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner className="py-20" />;

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role_id !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
