import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPassword, clearError, setSignupEmail, loginUser } from '../store/slices/authSlice';
import { Lock, Loader2, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import passwordIllustration from '../assets/images/password-illustration.svg';
import AuthLayout from '../components/AuthLayout';
import lock from '../assets/images/lock-pw.svg';

const SetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { signupEmail, signupToken, isLoading, error } = useAppSelector((state) => state.auth);

  // Form handling
  const [emailInput, setEmailInput] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === 'password') {
      if (!value) {
        setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
      } else if (value.length < 6) {
        setValidationErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        setValidationErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      } else if (value !== formData.password) {
        setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

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
    setFormData(prev => ({ ...prev, [name]: value }));

    // validation when field has been touched
    if (touched[name]) {
      if (name === 'password') {
        if (!value) setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
        else if (value.length < 6) setValidationErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
        else setValidationErrors(prev => ({ ...prev, password: '' }));
      }
      if (name === 'confirmPassword') {
        if (!value) setValidationErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
        else if (value !== formData.password) setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        else setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupToken) {
      alert('Signup session missing. Please restart signup.');
      navigate('/signup');
      return;
    }

    if (!validatePasswordForm()) return;

    try {
      console.log('Initiating setPassword for session...');

      const result = await dispatch(setPassword({
        signupToken,
        password: formData.password
      }));

      if (setPassword.fulfilled.match(result)) {
        console.log('Password set successfully, initiating auto-login...');

        // ✅ Auto-login to ensure we have a token (now we use signupEmail since it was verified)
        const currentEmail = signupEmail || '';

        const loginResult = await dispatch(loginUser({
          email: currentEmail,
          password: formData.password
        }));

        if (loginUser.fulfilled.match(loginResult)) {
          console.log('✅ Auto-login successful');
          navigate('/set-company');
        } else {
          throw new Error('Auto-login failed after password set');
        }
      } else {
        throw new Error(result.payload as string || 'Failed to set password');
      }

    } catch (error: any) {
      console.error('Password setup process failed:', error);
      alert(error.message || 'Failed to set password. Please try again.');
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center
            max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200"
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
      <div className="lg:hidden fixed top-14 left-36">
        <img src={lock} alt="Lock" className="mt-[70px] h-24" />
      </div>
      <p className="sm:hidden text-gray-600 text-xs mb-4 flex justify-center items-center ">
        Create a password that's at least 6 characters long.
      </p>

      {/* <hr className="sm:hidden my-4 mx-5 border-[1px] border-blue-200" /> */}

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
              <Lock className="h-5 w-5 text-gray-400 max-sm:hidden" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`block w-full pl-10 pr-12 py-3 border ${validationErrors.password
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg focus:outline-none focus:ring-2 transition-colors
                  max-sm:mb-5 max-sm:pl-4 max-sm:py-2 max-sm:rounded-xl max-sm:bg-gray-50 max-sm:border-gray-200 max-sm:placeholder-gray-400`}
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
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 max-sm:hidden" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`block w-full pl-10 pr-12 py-3 border ${validationErrors.confirmPassword
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg focus:outline-none focus:ring-2 transition-colors
                                max-sm:pl-4 max-sm:py-2 max-sm:rounded-xl max-sm:bg-gray-50 max-sm:border-gray-200 max-sm:placeholder-gray-400`}
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
             flex items-center justify-center
             max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Setting Password...
            </>
          ) : (
            <span>
              <span className="max-sm:hidden">Set Password & Continue</span>
              <span className="hidden max-sm:inline">Next</span>
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SetPassword;