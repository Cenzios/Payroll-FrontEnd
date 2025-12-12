import { Navigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  // Allow access if token exists in Redux OR in URL (for OAuth callback)
  if (!token && !urlToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
