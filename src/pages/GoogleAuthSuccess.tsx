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
        const hasCompanyParam = searchParams.get('hasCompany'); // 'true' or 'false'

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

        if (!isNewUserParam || isNewUserParam !== 'true') {
            // Has active subscription → go to dashboard
            console.log('Google user has active subscription → Redirecting to /dashboard');
            navigate('/dashboard', { replace: true });
        } else if (hasCompanyParam === 'true') {
            // Has company but no subscription → skip company setup, go straight to plan selection
            console.log('Google user has company but no subscription → Redirecting to /get-plan');
            navigate('/get-plan', { replace: true });
        } else {
            // Brand new user — no company, no subscription → start full setup
            console.log('Google user is brand new → Redirecting to /set-company');
            navigate('/set-company', { replace: true });
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