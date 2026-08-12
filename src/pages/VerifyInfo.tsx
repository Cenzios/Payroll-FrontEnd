import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startSignup } from '../store/slices/authSlice';
import { Mail, Loader2 } from 'lucide-react';
import verifyIllustration from '../assets/images/verify-illustration.svg';
import AuthLayout from '../components/AuthLayout';
import { resendVerificationEmail } from '../store/slices/authSlice';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyInfo = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { signupEmail, signupToken, isLoading } = useAppSelector((state) => state.auth);

  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!signupEmail || !signupToken) {
      navigate('/signup');
      return;
    }

    // const result = await dispatch(
    //   startSignup({
    //     fullName: '',
    //     email: signupEmail,
    //   })
    // );
    const result = await dispatch(resendVerificationEmail({ signupToken }));

    if (resendVerificationEmail.fulfilled.match(result)) {
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  if (!signupEmail) {
    navigate('/signup');
    return null;
  }

  return (
    <AuthLayout
      illustration={verifyIllustration}
      title="Verify Your Email"
    >
      <div className="mb-6 text-center">
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
            disabled={isLoading || cooldown > 0}
            className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                       max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:text-white max-sm:border-0 max-sm:shadow-blue-200">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyInfo;
