import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPassword, clearError } from '../store/slices/authSlice';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import password from '../assets/images/password-illustration.png';

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
                  src={password}
                  alt="Setup account"
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Create Your Password
              </h2>

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