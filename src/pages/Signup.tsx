import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startSignup, clearError } from '../store/slices/authSlice';
import { Loader2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {
      fullName: '',
      email: '',
    };

    if (!formData.fullName) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    setValidationErrors(errors);
    return !errors.fullName && !errors.email;
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
      const result = await dispatch(startSignup(formData));
      if (startSignup.fulfilled.match(result)) {
        navigate('/verify-info');
      }
    }
  };

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
                  <circle cx="100" cy="60" r="30" fill="#3B82F6" opacity="0.1"/>
                  <circle cx="100" cy="60" r="20" fill="#3B82F6"/>
                  <path d="M70 110 Q70 85 100 85 Q130 85 130 110 L130 140 Q130 145 125 145 L75 145 Q70 145 70 140 Z" fill="#3B82F6" opacity="0.1"/>
                  <path d="M75 115 Q75 95 100 95 Q125 95 125 115 L125 135 Q125 138 122 138 L78 138 Q75 138 75 135 Z" fill="#3B82F6"/>
                  <rect x="85" y="125" width="8" height="8" rx="1" fill="white"/>
                  <rect x="107" y="125" width="8" height="8" rx="1" fill="white"/>
                  <line x1="145" y1="100" x2="175" y2="100" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"/>
                  <line x1="145" y1="115" x2="165" y2="115" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Let's setup your account
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
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${
                    validationErrors.fullName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Nimal Kumara"
                />
                {validationErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${
                    validationErrors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="nimalkumara@mail.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.email}
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
                    Processing...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
