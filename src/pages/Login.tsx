import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError, logout } from '../store/slices/authSlice';
import { Mail, Lock, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';


const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 3l6-6C34.2 2.5 29.4 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7 5.4C11.5 13.3 17.3 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 2-1.8 5-5 7l7.7 6c4.5-4.1 7-10.2 7-16.7z" />
    <path fill="#FBBC05" d="M9.7 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7-5.4C.9 17 .3 20.4.3 24s.6 7 2.4 10.1l7-5.4z" />
    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.7-6c-2.1 1.4-4.8 2.3-8.3 2.3-6.7 0-12.5-3.8-15.4-9.3l-7 5.4C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

const Login = () => {

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/auth/google`;
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });

  // Clear any existing session when user visits login page
  useEffect(() => {
    if (token) {
      dispatch(logout());
    }
  }, []); // Only run once on mount

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

      // Check if login was successful
      if (loginUser.fulfilled.match(result)) {
        const { hasActivePlan } = result.payload;

        console.log('🔍 Login result:', {
          hasActivePlan,
          payload: result.payload
        });

        // Route based on subscription status
        if (hasActivePlan) {
          console.log('✅ Has subscription → Redirecting to Dashboard');
          navigate('/dashboard');
        } else {
          console.log('❌ No subscription → Redirecting to SetCompany');
          navigate('/set-company');
        }
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
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
              placeholder="you@example.com"
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
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border ${validationErrors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
              placeholder="••••••••"
            />
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        {/* ✅ GOOGLE LOGIN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <GoogleIcon />
          Continue with Google
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
    </AuthLayout>
  );
};

export default Login;
