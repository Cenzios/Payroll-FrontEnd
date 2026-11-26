// src/pages/GoogleAuthSuccess.tsx

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSignupEmail } from '../store/slices/authSlice';
import { refreshAccessToken } from '../auth/refreshSession';
import { Loader2 } from 'lucide-react';

/**
 * Landing page after the Google OAuth callback. The backend has already set
 * the HttpOnly refresh cookie and redirected here WITHOUT a token in the URL;
 * we exchange the cookie for an in-memory access token via POST /auth/refresh
 * and route using the `new` / `hasCompany` query params.
 */
function GoogleAuthSuccess(): JSX.Element {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        const isNewUserParam = searchParams.get('new'); // 'true' or null
        const hasCompanyParam = searchParams.get('hasCompany'); // 'true' or 'false'

        const completeSignIn = async (): Promise<void> => {
            // <AuthBootstrap> normally already exchanged the cookie on page load;
            // only refresh again if that did not yield a session.
            let email = user?.email ?? '';
            if (!isAuthenticated) {
                const { session } = await refreshAccessToken();
                if (!session) {
                    console.error('Google sign-in: unable to establish a session');
                    navigate('/login', { replace: true });
                    return;
                }
                email = session.user.email;
            }

            localStorage.setItem('signup_method', 'google'); // ✅ Flag as google signup (non-secret)
            if (email) {
                dispatch(setSignupEmail(email));
            }

            if (isNewUserParam !== 'true') {
                // Existing user → dashboard
                navigate('/dashboard', { replace: true });
            } else if (hasCompanyParam === 'true') {
                // Has company but no subscription → skip company setup, go straight to plan selection
                navigate('/get-plan', { replace: true });
            } else {
                // Brand new user — no company, no subscription → start full setup
                navigate('/set-company', { replace: true });
            }
        };

        void completeSignIn();
        // Runs once on landing; auth state is final after <AuthBootstrap>.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
