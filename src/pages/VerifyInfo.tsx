import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Mail, Loader2 } from 'lucide-react';
import verifyIllustration from '../assets/images/verify-illustration.svg';
import AuthLayout from '../components/AuthLayout';
import { resendVerificationEmail } from '../store/slices/authSlice';

const RESEND_COOLDOWN_SECONDS = 60;

/** "Check your email" page shown after signup. The verification link is only ever emailed. */
const VerifyInfo = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { signupEmail, signupFullName, isLoading } = useAppSelector((state) => state.auth);

  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async (): Promise<void> => {
    if (cooldown > 0 || !signupEmail || !signupFullName) return;
    setResendError('');

    const result = await dispatch(resendVerificationEmail({ fullName: signupFullName, email: signupEmail }));

    if (resendVerificationEmail.fulfilled.match(result)) {
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setResendSuccess(false), 3000);
    } else {
      setResendError(typeof result.payload === 'string' ? result.payload : 'Could not resend the email. Please try again later.');
    }
  };

  if (!signupEmail) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <AuthLayout
      illustration={verifyIllustration}
      title="Verify Your Email"
    >
      <div className="mb-6 text-center">
        <p className="text-gray-600">
          We've sent an email with the next step to
        </p>
        <p className="text-blue-600 font-medium mt-1">
          {signupEmail}
        </p>
      </div>

      {resendSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Email sent again. Please check your inbox.
        </div>
      )}

      {resendError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {resendError}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Please check your inbox and click the link in the email to continue.
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
