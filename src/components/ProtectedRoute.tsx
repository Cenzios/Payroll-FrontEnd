import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Renders children only for an authenticated session. The session is restored
 * by <AuthBootstrap> (POST /auth/refresh) before any route renders, so by the
 * time this runs `isAuthenticated` is final for this page load.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Temporary SKIP: User wants to bypass the monthly payment block check
  /*
  // Only show loader if we have a token (so checkAccessStatus will eventually run) and it's LOADING
  if (accessStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accessStatus === 'BLOCKED') {
    return <Navigate to="/settle-invoice" replace />;
  }
  */

  return <>{children}</>;
};

export default ProtectedRoute;
