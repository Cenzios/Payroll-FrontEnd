import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError, logout } from '../store/slices/authSlice';
import { Mail, Lock, Loader2, EyeOff, Eye, ShieldAlert, Phone } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import ContactModal from '../components/ContactModal';
import axiosInstance from '../api/axios';


const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#EA4335"
      d="M24 9.5c3.1 0 5.9 1.1 8.1 3l6-6C34.2 2.5 29.4 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7 5.4C11.5 13.3 17.3 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 2-1.8 5-5 7l7.7 6c4.5-4.1 7-10.2 7-16.7z"
    />
    <path
      fill="#FBBC05"
      d="M9.7 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7-5.4C.9 17 .3 20.4.3 24s.6 7 2.4 10.1l7-5.4z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 12-2.1 16-5.7l-7.7-6c-2.1 1.4-4.8 2.3-8.3 2.3-6.7 0-12.5-3.8-15.4-9.3l-7 5.4C6.6 42.6 14.6 48 24 48z"
    />
  </svg>
);

// Messages that trigger the special banner UI (locked or suspended)
const LOCKED_MESSAGES = [
  'Your account has been locked. Please contact support for assistance.',
];
const SUSPENDED_MESSAGES = [
  'Your account is currently suspended. Please contact support for assistance.',
];
const BANNER_MESSAGES = [...LOCKED_MESSAGES, ...SUSPENDED_MESSAGES];

const Login = () => {
  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/auth/google`;
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // // const [searchParams] = useSearchParams();
  // const reason = searchParams.get("reason");
  // const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  // Contact modal state
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Polling state: tracks if we're in "account locked" or "account suspended" mode
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);
  const [blockedType, setBlockedType] = useState<'locked' | 'suspended' | null>(null);
  const [blockedEmail, setBlockedEmail] = useState('');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect locked/suspended account from error message
  useEffect(() => {
    if (error && LOCKED_MESSAGES.includes(error)) {
      setIsAccountBlocked(true);
      setBlockedType('locked');
      setBlockedEmail(formData.email);
    } else if (error && SUSPENDED_MESSAGES.includes(error)) {
      setIsAccountBlocked(true);
      setBlockedType('suspended');
      setBlockedEmail(formData.email);
    } else if (!error) {
      setIsAccountBlocked(false);
      setBlockedType(null);
    }
  }, [error]);

  // Poll for account unlock/unsuspend when blocked
  useEffect(() => {
    if (!isAccountBlocked || !blockedEmail) return;

    const checkStatus = async () => {
      try {
        const { data } = await axiosInstance.post('/auth/check-lock-status', { email: blockedEmail });
        const result = data?.data;
        const stillBlocked =
          (blockedType === 'locked' && result?.isLocked === true) ||
          (blockedType === 'suspended' && result?.isSuspended === true);

        if (!stillBlocked) {
          // Account was reactivated by admin — clear state automatically
          setIsAccountBlocked(false);
          setBlockedType(null);
          dispatch(clearError());
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch {
        // Silently ignore — will retry on next interval
      }
    };

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(checkStatus, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAccountBlocked, blockedEmail, blockedType, dispatch]);

  // Clear any existing session when user visits login page
  useEffect(() => {
    if (token) {
      dispatch(logout());
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
    };

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    // If user edits the form, clear the blocked state so they can retry
    if (isAccountBlocked) {
      setIsAccountBlocked(false);
      setBlockedType(null);
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Clear suspension params so banner disappears
      // if (isSuspension) {
      //   const url = new URL(window.location.href);
      //   url.searchParams.delete("reason");
      //   url.searchParams.delete("error");
      //   window.history.replaceState({}, "", url.toString());
      //   sessionStorage.removeItem("suspended_email");
      //   setPollingEmail(null);
      // }

      const result = await dispatch(loginUser(formData));

      if (loginUser.fulfilled.match(result)) {
        const { hasActivePlan, hasCompany } = result.payload;

        console.log("🔍 Login result:", {
          hasActivePlan,
          hasCompany,
          payload: result.payload,
        });

        if (hasActivePlan) {
          console.log("✅ Has subscription → Redirecting to Dashboard");
          navigate("/dashboard");
        } else if (hasCompany) {
          console.log(
            "🏢 Has company but no subscription → Redirecting to GetPlan",
          );
          navigate("/get-plan");
        } else {
          console.log(
            "🆕 No company, no subscription → Redirecting to SetCompany",
          );
          navigate("/set-company");
        }
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Please login to access your account."
    >
      {/* Contact Support Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        title="Contact Support"
        subtitle="We're here to help you"
        description={
          blockedType === 'suspended'
            ? 'Your account has been suspended. Please reach out to our support team to have it reactivated.'
            : 'Your account has been locked. Please reach out to our support team and we\'ll get you back in as soon as possible.'
        }
      />

      {/* Account Locked / Suspended Banner */}
      {isAccountBlocked && blockedType && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 overflow-hidden max-sm:mx-0 max-sm:rounded-xl">
          <div className="px-4 py-3 max-sm:px-4 max-sm:py-4">
            <p className="text-xs text-red-700 font-semibold mb-3 max-sm:text-sm">
              {blockedType === 'suspended'
                ? 'Your account has been suspended by an administrator.'
                : 'Your account has been locked by an administrator.'}
            </p>

            <p className="text-xs text-red-700 mb-3 max-sm:text-sm max-sm:leading-relaxed">
              Please contact our support team to have your account reactivated. This page will update automatically once access is restored.
            </p>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-2 w-full justify-center bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-150 max-sm:py-3 max-sm:text-base max-sm:rounded-xl"
            >
              <Phone className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* Generic Error (non-blocked) */}
      {error && !isAccountBlocked && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-sm:text-sm max-sm:rounded-xl max-sm:mx-0">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-sm:px-4 max-sm:space-y-4">
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3 max-sm:py-3.5 max-sm:text-base max-sm:rounded-xl max-sm:mt-6"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center justify-center gap-3 mt-6 max-sm:mt-5">
            <hr className="flex-1 border-gray-300" />
            <p className="text-gray-500 max-sm:text-sm">or</p>
            <hr className="flex-1 border-gray-300" />
          </div>

          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mt-6 mb-2 max-sm:text-base max-sm:mt-5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border ${validationErrors.email
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-lg focus:outline-none focus:ring-2 transition-colors max-sm:py-3.5 max-sm:text-base max-sm:rounded-xl`}
              placeholder="Enter your Email"
            />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2 max-sm:text-base"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border ${validationErrors.password
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-lg focus:outline-none focus:ring-2 transition-colors max-sm:py-3.5 max-sm:text-base max-sm:rounded-xl`}
              placeholder="Enter your Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.password}
            </p>
          )}
        </div>

        <div className="mt-6 text-right max-sm:mt-4">
          <p className="text-sm text-gray-600 max-sm:text-base">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#3A8BFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#337AEB] focus:outline-none focus:ring-2 focus:ring-[#3A8BFF] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center max-sm:rounded-xl max-sm:py-4 max-sm:text-base max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200 max-sm:border-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 text-center max-sm:mt-8 max-sm:px-4">
        <p className="text-sm text-gray-600 max-sm:text-base">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
