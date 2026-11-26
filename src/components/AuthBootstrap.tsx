import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapSession } from '../store/slices/sessionThunks';

interface AuthBootstrapProps {
  children: ReactNode;
}

/**
 * Restores the session (POST /auth/refresh using the HttpOnly cookie) before
 * any route renders, so protected pages and post-redirect pages
 * (/payment/success, /confirmation, /buy-plan, ...) have an access token.
 */
const AuthBootstrap = ({ children }: AuthBootstrapProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);

  useEffect(() => {
    if (bootstrapStatus === 'pending') {
      // Single-flight in refreshAccessToken makes StrictMode double-invocation safe.
      void dispatch(bootstrapSession());
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (bootstrapStatus !== 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthBootstrap;
