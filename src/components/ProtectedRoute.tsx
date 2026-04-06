import { Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthFromToken } from '../store/slices/authSlice';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, accessStatus } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    if (urlToken && !token) {
      dispatch(setAuthFromToken(urlToken));
      // Remove token from URL
      window.history.replaceState({}, '', location.pathname);
    }
  }, [urlToken, token, dispatch, location.pathname]);

  // Use effective token for logic (either from Redux or about to enter Redux)
  const effectiveToken = token || urlToken;

  // Allow access if token exists in Redux OR in URL (for OAuth callback)
  if (!effectiveToken) {
    return <Navigate to="/login" replace />;
  }

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

  return <>{children}</>;
};

export default ProtectedRoute;
