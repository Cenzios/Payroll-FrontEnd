import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../store/hooks';
import { apiSlice } from '../store/apiSlice';
import { logout } from '../store/slices/sessionThunks';

/**
 * The one logout used by every logout button: revokes the server session
 * (POST /auth/logout), clears auth state, the selected company and per-user flow
 * storage, drops all cached API data (RTK Query and React Query), then goes to /login.
 */
export function useLogout(): () => Promise<void> {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    return useCallback(async (): Promise<void> => {
        await dispatch(logout());
        dispatch(apiSlice.util.resetApiState());
        queryClient.clear();
        navigate('/login', { replace: true });
    }, [dispatch, navigate, queryClient]);
}
