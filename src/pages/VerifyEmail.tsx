import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { verifyEmail } from '../store/slices/authSlice';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
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

    // ✅ Check if email exists - if not, redirect to signup
    if (!signupEmail && !token) {
      console.log('No email found, redirecting to signup');
      navigate('/signup');
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please try again.');
      return;
    }

    const verify = async () => {
      hasVerified.current = true;

      try {
        const result = await dispatch(verifyEmail(token));

        if (verifyEmail.fulfilled.match(result)) {
          setStatus('success');
          setMessage(result.payload.message || 'Email verified successfully!');

          // ✅ Redirect after 1.5 seconds
          setTimeout(() => {
            console.log('Redirecting to set-password with email:', signupEmail);
            navigate('/set-password');
          }, 1500);
        } else {
          setStatus('error');
          setMessage(result.payload as string || 'Email verification failed.');

          // ✅ If verification fails, redirect to signup after 3 seconds
          setTimeout(() => {
            console.log('Verification failed, redirecting to signup');
            navigate('/signup');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred.');

        setTimeout(() => {
          navigate('/signup');
        }, 3000);
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
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              Redirecting to signup page...
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Start Over
              </button>
              <button
                onClick={() => navigate('/verify-info')}
                className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Resend Verification
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;