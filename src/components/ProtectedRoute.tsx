import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useGetCompaniesQuery } from '../store/apiSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * When true (default) the user must have finished onboarding: a plan
   * (GET /company is 403 without a subscription) and at least one company.
   */
  requireOnboarding?: boolean;
}

const errorStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  const { status } = error as { status: unknown };
  return typeof status === 'number' ? status : undefined;
};

/** Trial signups create their company on the dashboard from these saved form values. */
const hasPendingTrialCompany = (): boolean => {
  try {
    return !!localStorage.getItem('temp_companyName');
  } catch {
    return false;
  }
};

const FullPageLoader = (): JSX.Element => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-label="Loading" />
  </div>
);

/**
 * Renders children only for an authenticated session. The session is restored
 * by <AuthBootstrap> (POST /auth/refresh) before any route renders, so by the
 * time this runs `isAuthenticated` is final for this page load.
 * Users without a plan go to /get-plan, users without a company to /set-company.
 */
const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps): JSX.Element => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [mountedAt] = useState<number>(() => Date.now());
  const { data: companies, error, isError, isFetching, startedTimeStamp } = useGetCompaniesQuery(undefined, {
    skip: !isAuthenticated || !requireOnboarding,
    // Plans and companies also change outside RTK Query (start-trial, payment confirmation),
    // so always re-check on mount and decide only on a response requested after mount.
    refetchOnMountOrArgChange: true,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!requireOnboarding) {
    return <>{children}</>;
  }

  const hasCompany = !!companies && companies.length > 0;
  const isFresh = startedTimeStamp !== undefined && startedTimeStamp >= mountedAt && !isFetching;
  if (!hasCompany && !isFresh) {
    return <FullPageLoader />;
  }
  if (isError && errorStatus(error) === 403) {
    return <Navigate to="/get-plan" replace />;
  }
  if (!isError && !hasCompany && !hasPendingTrialCompany()) {
    return <Navigate to="/set-company" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
