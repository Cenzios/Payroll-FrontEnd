import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPassword, clearError } from '../store/slices/authSlice';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const SetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { signupEmail, isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // ✅ Check if signupEmail exists
    console.log('SetPassword - signupEmail:', signupEmail);

    if (!signupEmail) {
      console.log('No signupEmail found, redirecting to signup');
      navigate('/signup');
    }
  }, [signupEmail, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {
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
      console.error('No email available for password setup');
      navigate('/signup');
      return;
    }

    if (validateForm()) {
      console.log('Setting password for:', signupEmail);
      const result = await dispatch(
        setPassword({
          email: signupEmail,
          password: formData.password,
        })
      );

      if (setPassword.fulfilled.match(result)) {
        console.log('Password set successfully, redirecting to login');
        navigate('/login');
      }
    }
  };

  // ✅ Show loading while checking email
  if (!signupEmail) {
    return null;
  }

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
            <div className="mb-8 text-center">
              <div className="mb-4">
                <svg className="w-24 h-24 mx-auto" viewBox="0 0 200 200" fill="none">
                  <rect x="50" y="70" width="100" height="70" rx="8" fill="#3B82F6" opacity="0.1" />
                  <rect x="60" y="80" width="80" height="50" rx="6" fill="white" stroke="#3B82F6" strokeWidth="3" />
                  <circle cx="100" cy="105" r="12" fill="#3B82F6" />
                  <rect x="96" y="105" width="8" height="15" fill="#3B82F6" />
                  <circle cx="70" cy="65" r="8" fill="#3B82F6" />
                  <line x1="70" y1="58" x2="70" y2="50" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="130" cy="65" r="8" fill="#3B82F6" />
                  <line x1="130" y1="58" x2="130" y2="50" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Create Your Password
              </h2>
              <p className="text-gray-600 mt-2">
                Setting password for: <span className="font-medium text-blue-600">{signupEmail}</span>
              </p>
            </div>

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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;