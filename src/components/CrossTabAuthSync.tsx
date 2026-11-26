import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { apiSlice } from '../store/apiSlice';
import { sessionEndedElsewhere } from '../store/slices/authSlice';
import { clearAccessToken } from '../auth/tokenStore';
import { subscribeAuthEvents } from '../auth/crossTabAuth';

/**
 * Applies logins / logouts made in other tabs:
 * - logout elsewhere: clear this tab's in-memory session and cached data, go to /login
 *   (no API call: the session is already revoked, and the next login must not be touched)
 * - login as a different user elsewhere: reload into that session (the company id is
 *   revalidated by CompanySelectionGuard on load). A logged-out tab follows only from /login.
 */
const CrossTabAuthSync = (): null => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userId = useAppSelector((state) => state.auth.user?.id ?? null);
    const userIdRef = useRef<string | null>(userId);
    userIdRef.current = userId;

    useEffect(() => subscribeAuthEvents((event): void => {
        const currentUserId = userIdRef.current;
        if (event.type === 'logout') {
            if (!currentUserId) return;
            clearAccessToken();
            dispatch(sessionEndedElsewhere());
            dispatch(apiSlice.util.resetApiState());
            queryClient.clear();
            navigate('/login', { replace: true });
            return;
        }
        if (event.userId === currentUserId) return;
        if (!currentUserId && window.location.pathname !== '/login') return;
        window.location.replace('/dashboard');
    }), [dispatch, navigate, queryClient]);

    return null;
};

export default CrossTabAuthSync;
