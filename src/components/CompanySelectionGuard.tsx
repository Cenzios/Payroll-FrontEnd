import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGetCompaniesQuery } from '../store/apiSlice';
import { clearSelectedCompanyId, setSelectedCompanyId } from '../store/slices/authSlice';

/**
 * On session start (and whenever the company list changes) makes sure the
 * stored selectedCompanyId belongs to the signed-in user; otherwise falls back
 * to the user's first company. Renders nothing.
 */
const CompanySelectionGuard = (): null => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const selectedCompanyId = useAppSelector((state) => state.auth.selectedCompanyId);
    const { data: companies, isSuccess } = useGetCompaniesQuery(undefined, { skip: !isAuthenticated });

    useEffect(() => {
        if (!isAuthenticated || !isSuccess || !companies) return;
        if (selectedCompanyId && companies.some((c) => c.id === selectedCompanyId)) return;
        const first = companies[0];
        if (first) {
            dispatch(setSelectedCompanyId(first.id));
        } else if (selectedCompanyId) {
            dispatch(clearSelectedCompanyId());
        }
    }, [isAuthenticated, isSuccess, companies, selectedCompanyId, dispatch]);

    return null;
};

export default CompanySelectionGuard;
