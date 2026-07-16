import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError, logout } from '../store/slices/authSlice';
import { Mail, Lock, Loader2, EyeOff, Eye } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Toast from '../components/Toast';

const GoogleIcon = () => ( /* ... unchanged ... */ );

// Module‑level flag – persists across mounts
let toastShown = false;

const Login = () => {
  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/auth/google`;
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const errorParam = searchParams.get('error');

  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });

  // ── Toast state ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Determine if this is a suspension redirect ──
  const isSuspension = reason === 'suspended' || errorParam === 'account_suspended';

  // ── Clear Redux error before it can trigger any global toast ──
  useLayoutEffect(() => {
    if (isSuspension) {
      dispatch(clearError());
    }
  }, [isSuspension, dispatch]);

  // ── Show toast once – module‑level flag ensures it runs only once ──
  useEffect(() => {
    if (isSuspension && !toastShown) {
      toastShown = true;
      setToast({
        message: 'Your account has been suspended. Please contact support for assistance.',
        type: 'error',
      });
    }
  }, [isSuspension]);

  // ── Clear any existing session ──
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
      email: '',
      password: '',
    };

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
      [name]: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const result = await dispatch(loginUser(formData));

      if (loginUser.fulfilled.match(result)) {
        const { hasActivePlan, hasCompany } = result.payload;

        console.log('🔍 Login result:', {
          hasActivePlan,
          hasCompany,
          payload: result.payload,
        });

        if (hasActivePlan) {
          console.log('✅ Has subscription → Redirecting to Dashboard');
          navigate('/dashboard');
        } else if (hasCompany) {
          console.log('🏢 Has company but no subscription → Redirecting to GetPlan');
          navigate('/get-plan');
        } else {
          console.log('🆕 No company, no subscription → Redirecting to SetCompany');
          navigate('/set-company');
        }
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Please login to access your account."
    >
      {/* Inline error – hidden during suspension to avoid duplication */}
      {error && !isSuspension && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-sm:px-5">
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center justify-center gap-3 mt-6">
            <hr className="flex-1 border-gray-300" />
            <p className="text-gray-500">or</p>
            <hr className="flex-1 border-gray-300" />
          </div>

          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mt-6 mb-2"
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
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
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
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border ${validationErrors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
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

        <div className="mt-6 text-right">
          <p className="text-sm text-gray-600">
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
          className="w-full bg-[#3A8BFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#337AEB] focus:outline-none focus:ring-2 focus:ring-[#3A8BFF] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                    max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:text-white max-sm:border-0 max-sm:shadow-blue-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuthLayout>
  );
};

export default Login;