import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken } from '../store/slices/authSlice';

const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Save token in localStorage
            localStorage.setItem('token', token);

            // Decode token and extract user data
            dispatch(setAuthFromToken(token));

            // Also store user data separately in localStorage for persistence
            // The setAuthFromToken action already decodes the token and sets user in Redux
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const decoded = JSON.parse(jsonPayload);

            // Store user object in localStorage
            const user = {
                id: decoded.userId,
                fullName: decoded.fullName || decoded.name || '',
                email: decoded.email || '',
                role: decoded.role,
            };
            localStorage.setItem('user', JSON.stringify(user));

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error processing Google auth token:', error);
            navigate('/login');
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-700 text-lg font-medium">Signing you in with Google...</p>
            </div>
        </div>
    );
};

export default GoogleAuthSuccess;
