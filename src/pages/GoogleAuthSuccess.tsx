// src/pages/GoogleAuthSuccess.tsx

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken } from '../store/slices/authSlice';
import { Loader2 } from 'lucide-react';

function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const isNewUserParam = searchParams.get('new'); // 'true' or null


        if (!token) {
            console.error('No token found in Google OAuth redirect');
            navigate('/login', { replace: true });
            return;
        }

        // Store token
        localStorage.setItem('token', token);
        localStorage.setItem('signup_method', 'google'); // ✅ Flag as google signup

        // Update Redux store with user data from token
        dispatch(setAuthFromToken(token));

        // Determine redirect based on whether user is new or lacks subscription
        const shouldRedirectToGetPlan = isNewUserParam === 'true';

        if (shouldRedirectToGetPlan) {
            console.log('Google user is new or has no active subscription → Redirecting to /get-plan');
            navigate('/get-plan', { replace: true });
        } else {
            console.log('Google user has active subscription → Redirecting to /dashboard');
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Completing Sign In...
                </h2>
                <p className="text-gray-600">
                    Please wait while we securely log you in with Google.
                </p>
            </div>
        </div>
    );
}

export default GoogleAuthSuccess;