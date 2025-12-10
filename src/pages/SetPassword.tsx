import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTempPassword, clearError, setSignupEmail } from '../store/slices/authSlice';
import { Lock, Loader2, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import passwordIllustration from '../assets/images/password-illustration.svg';
import AuthLayout from '../components/AuthLayout';

const SetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { signupEmail, isLoading, error } = useAppSelector((state) => state.auth);

  // Form handling
  const [emailInput, setEmailInput] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setValidationErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!validateEmail(emailInput)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return;
    }
    dispatch(setSignupEmail(emailInput));
  };

  const validatePasswordForm = () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return !errors.password && !errors.confirmPassword;
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

    if (!signupEmail) {
      // Should not happen if UI is correct, but safety check
      return;
    }

    if (validatePasswordForm()) {
      console.log('Setting temporary password for:', signupEmail);
      dispatch(setTempPassword(formData.password));
      console.log('Password stored, redirecting to set-company');
      navigate('/set-company');
    }
  };

  // 1. If no email, show email input form
  if (!signupEmail) {
    return (
      <AuthLayout
        illustration={passwordIllustration}
        title="Confirm Your Email"
      >
        <p className="text-gray-600 mb-6">
          To secure your account, please confirm the email address you used to sign up.
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="emailInput"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="emailInput"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`block w-full pl-10 pr-12 py-3 border ${validationErrors.email
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                placeholder="you@company.com"
                autoFocus
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
          >
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Start over with a new account
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // 2. If email exists, show password form
  return (
    <AuthLayout
      illustration={passwordIllustration}
      title="Create Your Password"
    >
      {/* <div className="mb-6 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
        <span className="text-sm text-blue-800">
          Setting password for: <strong>{signupEmail}</strong>
        </span>
        <button
          onClick={() => dispatch(setSignupEmail(null))}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Change
        </button>
      </div> */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password <span className="text-red-500">*</span>
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
              className={`block w-full pl-10 pr-12 py-3 border ${validationErrors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
              placeholder="••••••••"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Re-enter password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`block w-full pl-10 pr-12 py-3 border ${validationErrors.confirmPassword
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#3A8BFF] text-white font-semibold py-3 px-4 rounded-lg 
             hover:bg-[#337AEB] focus:outline-none 
             focus:ring-2 focus:ring-[#3A8BFF] focus:ring-offset-2 
             transition-all duration-200 
             disabled:opacity-50 disabled:cursor-not-allowed 
             flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Setting Password...
            </>
          ) : (
            'Set Password & Continue'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SetPassword;