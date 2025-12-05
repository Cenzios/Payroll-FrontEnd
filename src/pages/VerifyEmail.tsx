import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { verifyEmail } from '../store/slices/authSlice';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#5B8EF5] relative overflow-hidden">
        {/* Circular ring decorations */}
        <div className="absolute top-20 right-20 w-60 h-60 border-[30px] border-white/15 rounded-full translate-x-32 -translate-y-32"></div>
        {/* <div className="absolute top-0 right-0 w-96 h-96 border-[12px] border-white/10 rounded-full translate-x-40 -translate-y-40"></div> */}

        <div className="absolute top-55 -left-20 w-64 h-64 border-[30px] border-white/15 rounded-full"></div>
        <div className="absolute top-1/2 -left-28 w-80 h-80 border-[20px] border-white/10 rounded-full"></div>

        <div className="absolute bottom-[-20px] -left-28 w-40 h-40 bg-white/15 rounded-full translate-x-80 transition-all duration-300 ease-in-out"></div>



        {/* <div className="absolute bottom-0 left-0 w-[500px] h-[500px] border-[3px] border-white/15 rounded-full translate-x-80 transition-all duration-300 ease-in-out"></div> */}

        {/* Dot grid pattern */}
        <div className="absolute bottom-10 right-16 grid grid-cols-10 gap-3 opacity-20">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
          ))}
        </div>


        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" fill="#5B8EF5" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Payrole</h1>
          </div>

          <h2 className="text-4xl font-semibold mb-4 leading-tight">
            Automated. Accurate. On Time.
          </h2>
          <p className="text-2xl text-white/100 font-light">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;