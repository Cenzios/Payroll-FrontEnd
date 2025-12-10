import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { verifyEmail } from '../store/slices/authSlice';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { signupEmail } = useAppSelector((state) => state.auth);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const token = searchParams.get('token');

    // If no token, check if we just need to show the "please check email" state
    // But this component seems to handle the actual verification FROM the email link
    if (!token) {
      if (!signupEmail) {
        // If no token AND no email in state, this is an invalid access
        navigate('/signup');
        return;
      }
      // If we have an email but no token, users might land here manually? 
      // Usually they shouldn't. Let's assume invalid link if no token.
      setStatus('error');
      setMessage('Invalid verification link. Please checks your email for the correct link.');
      return;
    }

    const verify = async () => {
      hasVerified.current = true;

      try {
        const result = await dispatch(verifyEmail(token));

        if (verifyEmail.fulfilled.match(result)) {
          setStatus('success');
          setMessage(result.payload.message || 'Email verified successfully!');

          // Redirect after 2 seconds
          setTimeout(() => {
            navigate('/set-password', { replace: true });
          }, 1200);
        } else {
          setStatus('error');
          setMessage(result.payload as string || 'Email verification failed or link expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
      }
    };

    verify();
  }, [dispatch, searchParams, navigate, signupEmail]);

  return (
    <AuthLayout>
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <Loader2 className="w-20 h-20 mx-auto text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
              Redirecting to password setup...
            </div>

          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <XCircle className="w-20 h-20 mx-auto text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Back to Signup
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;