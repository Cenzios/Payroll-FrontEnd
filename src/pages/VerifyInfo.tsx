import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startSignup } from '../store/slices/authSlice';
import { Mail, Loader2 } from 'lucide-react';
import verifyImg from '../assets/images/verify-illustration.png';

const VerifyInfo = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { signupEmail, isLoading } = useAppSelector((state) => state.auth);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!signupEmail) {
      navigate('/signup');
      return;
    }

    const result = await dispatch(
      startSignup({
        fullName: '',
        email: signupEmail,
      })
    );

    if (startSignup.fulfilled.match(result)) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  if (!signupEmail) {
    navigate('/signup');
    return null;
  }

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
            <div className="mb-8 text-center">
              <div className="mb-4">
                <img
                  src={verifyImg}
                  alt="Setup account"
                  className="w-28 h-28 mx-auto object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Verify Your Email
              </h2>
              <p className="text-gray-600">
                We've sent a verification link to
              </p>
              <p className="text-blue-600 font-medium mt-1">
                {signupEmail}
              </p>
            </div>

            {resendSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Verification email sent successfully!
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Please check your inbox and click the verification link to continue.
                      Don't forget to check your spam folder!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyInfo;
