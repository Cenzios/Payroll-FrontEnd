import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { apiSlice } from '../store/apiSlice';
import { logout } from '../store/slices/sessionThunks';

/**
 * The one logout used by every logout button: revokes the server session
 * (POST /auth/logout), clears auth state + selected company, drops all cached
 * API data, then goes to /login.
 */
export function useLogout(): () => Promise<void> {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    return useCallback(async (): Promise<void> => {
        await dispatch(logout());
        dispatch(apiSlice.util.resetApiState());
        navigate('/login', { replace: true });
    }, [dispatch, navigate]);
}
