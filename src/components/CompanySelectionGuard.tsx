import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGetCompaniesQuery } from '../store/apiSlice';
import { clearSelectedCompanyId, setSelectedCompanyId } from '../store/slices/authSlice';

interface CompanySelectionGuardProps {
    children: ReactNode;
}

/**
 * On session start (and whenever the company list changes) makes sure the
 * stored selectedCompanyId belongs to the signed-in user; otherwise falls back
 * to the user's first company. While a stored id is still being checked the
 * pages are held back, so they never request another user's company (404s).
 */
const CompanySelectionGuard = ({ children }: CompanySelectionGuardProps): JSX.Element => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const selectedCompanyId = useAppSelector((state) => state.auth.selectedCompanyId);
    const { data: companies, isSuccess, isLoading } = useGetCompaniesQuery(undefined, { skip: !isAuthenticated });

    const isKnown = !!selectedCompanyId && !!companies?.some((c) => c.id === selectedCompanyId);

    useEffect(() => {
        if (!isAuthenticated || !isSuccess || !companies || isKnown) return;
        const first = companies[0];
        if (first) {
            dispatch(setSelectedCompanyId(first.id));
        } else if (selectedCompanyId) {
            dispatch(clearSelectedCompanyId());
        }
    }, [isAuthenticated, isSuccess, companies, selectedCompanyId, isKnown, dispatch]);

    // Hold pages only while a stored id is unverified (loading, or about to be replaced)
    const isChecking = isAuthenticated && !!selectedCompanyId && (isLoading || (isSuccess && !isKnown));
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-label="Loading" />
            </div>
        );
    }

    return <>{children}</>;
};

export default CompanySelectionGuard;
