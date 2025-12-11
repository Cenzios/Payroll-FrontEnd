import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken, setSignupEmail } from '../store/slices/authSlice';

const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Save token in localStorage
            localStorage.setItem('token', token);

            // Decode token and extract user data
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
                fullName: decoded.fullName || '',
                email: decoded.email || '',
                role: decoded.role,
            };
            localStorage.setItem('user', JSON.stringify(user));

            // Update Redux store
            dispatch(setAuthFromToken(token));

            // ✅ CHECK IF NEW USER (NO SUBSCRIPTION)
            if (isNewUser === 'true') {
                // Store email for registration flow
                localStorage.setItem('reg_email', user.email);
                dispatch(setSignupEmail(user.email));

                console.log('New Google user - redirecting to GetPlan');
                navigate('/get-plan');
                return;
            }

            // ✅ EXISTING USER WITH SUBSCRIPTION
            console.log('Existing Google user - redirecting to Dashboard');
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