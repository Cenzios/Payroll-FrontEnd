import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { verifyEmail } from '../store/slices/authSlice';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please try again.');
      return;
    }

    const verify = async () => {
      try {
        const result = await dispatch(verifyEmail(token));

        if (verifyEmail.fulfilled.match(result)) {
          setStatus('success');
          setMessage(result.payload.message || 'Email verified successfully!');
          setTimeout(() => {
            navigate('/set-password');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.payload as string || 'Email verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    verify();
  }, [dispatch, searchParams, navigate]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300 rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md"></div>
            </div>
            <h1 className="text-4xl font-bold">Payrole</h1>
          </div>

          <h2 className="text-3xl font-bold mb-4">
            Automated. Accurate. On Time.
          </h2>
          <p className="text-xl text-blue-100">
            Welcome to Payrole.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
