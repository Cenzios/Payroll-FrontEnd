import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, setAuthFromToken, setSignupEmail } from '../store/slices/authSlice';
import { Building2, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import companyIllustration from '../assets/images/company-illustration.svg';
import AuthLayout from '../components/AuthLayout';

interface DecodedToken {
  userId: string;
  role: string;
  email: string;
  fullName: string;
  iat: number;
  exp: number;
}

const SetCompany = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { isLoading, error, signupEmail, token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    companyName: '',
    companyCount: 1,
    numberOfPeople: 1,
  });

  const [validationErrors, setValidationErrors] = useState({
    companyName: '',
    companyCount: '',
    numberOfPeople: '',
  });

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const isNewUser = searchParams.get('new');

    if (token) {
      try {
        // Decode token to get user email
        const decoded = jwtDecode<DecodedToken>(token);

        // Set auth data in Redux
        dispatch(setAuthFromToken(token));

        // Set email for subscription flow
        if (decoded.email) {
          dispatch(setSignupEmail(decoded.email));
          console.log('✅ Google user email set in SetCompany:', decoded.email);
        }

        // Clean up URL
        window.history.replaceState({}, '', '/set-company');
      } catch (error) {
        console.error('❌ Error processing OAuth token:', error);
      }
    }
  }, [searchParams, dispatch]);

  // Only redirect to signup if there's no email AND no token in URL
  useEffect(() => {
    const urlToken = searchParams.get('token');

    // If there's a token in URL, wait for it to be processed
    if (urlToken) {
      return;
    }

    // If user is authenticated (has token), allow access even without signupEmail
    if (token) {
      return;
    }

    // Only redirect if no email, no token, and not authenticated
    if (!signupEmail) {
      navigate('/signup');
    }
  }, [signupEmail, navigate, searchParams, token]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {
      companyName: '',
      companyCount: '',
      numberOfPeople: '',
    };

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }

    if (formData.companyCount < 1) {
      errors.companyCount = 'Must be at least 1';
    }

    if (formData.numberOfPeople < 1) {
      errors.numberOfPeople = 'Must be at least 1';
    }

    setValidationErrors(errors);
    return !errors.companyName && !errors.companyCount && !errors.numberOfPeople;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'companyName' ? value : parseInt(value) || 0,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleNumberChange = (field: 'companyCount' | 'numberOfPeople', delta: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(1, prev[field] + delta),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      navigate('/get-plan');
    }
  };

  if (!signupEmail && !token) {
    return null;
  }

  return (
    <AuthLayout
      illustration={companyIllustration}
      title="Tell Us About Your Company"
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border ${validationErrors.companyName
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 transition-colors`}
              placeholder="Cenzios (Pvt) Ltd"
            />
          </div>
          {validationErrors.companyName && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.companyName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="companyCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            How many companies do you have
          </label>
          <div className="relative">
            <input
              type="number"
              id="companyCount"
              name="companyCount"
              value={formData.companyCount}
              onChange={handleChange}
              min="1"
              className={`block w-full px-4 py-3 border ${validationErrors.companyCount
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 transition-colors`}
              placeholder="3"
            />
            <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-300">
              <button
                type="button"
                onClick={() => handleNumberChange('companyCount', 1)}
                className="px-3 flex-1 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors border-b border-gray-300"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleNumberChange('companyCount', -1)}
                className="px-3 flex-1 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ▼
              </button>
            </div>
          </div>
          {validationErrors.companyCount && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.companyCount}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="numberOfPeople"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of people working with you
          </label>
          <div className="relative">
            <input
              type="number"
              id="numberOfPeople"
              name="numberOfPeople"
              value={formData.numberOfPeople}
              onChange={handleChange}
              min="1"
              className={`block w-full px-4 py-3 border ${validationErrors.numberOfPeople
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 transition-colors`}
              placeholder="36"
            />
            <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-300">
              <button
                type="button"
                onClick={() => handleNumberChange('numberOfPeople', 1)}
                className="px-3 flex-1 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors border-b border-gray-300"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleNumberChange('numberOfPeople', -1)}
                className="px-3 flex-1 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ▼
              </button>
            </div>
          </div>
          {validationErrors.numberOfPeople && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.numberOfPeople}
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
              Processing...
            </>
          ) : (
            'Next'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SetCompany;
