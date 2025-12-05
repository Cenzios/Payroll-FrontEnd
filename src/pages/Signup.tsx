import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startSignup, clearError } from '../store/slices/authSlice';
import { Loader2 } from 'lucide-react';
import passwordImg from '../assets/images/password-illustration.png';

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
      <div className="hidden lg:flex lg:w-1/2 bg-[#5B8EF5] relative overflow-hidden">
        {/* Circular ring decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 border-[3px] border-white/15 rounded-full translate-x-32 -translate-y-32"></div>
        <div className="absolute top-0 right-0 w-96 h-96 border-[3px] border-white/10 rounded-full translate-x-40 -translate-y-40"></div>

        <div className="absolute top-1/2 -left-20 w-64 h-64 border-[3px] border-white/15 rounded-full"></div>
        <div className="absolute top-1/2 -left-28 w-80 h-80 border-[3px] border-white/10 rounded-full"></div>

        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] border-[3px] border-white/15 rounded-full -translate-x-64 translate-y-64"></div>

        {/* Dot grid pattern */}
        <div className="absolute bottom-20 right-16 grid grid-cols-6 gap-3 opacity-20">
          {[...Array(24)].map((_, i) => (
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
          <p className="text-lg text-white/100 font-light">
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
                  src="/images/password-illustration.png"
                  alt="Password setup"
                  className="w-24 h-24 mx-auto object-contain"
                />
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
                  className={`block w-full px-4 py-3 border ${validationErrors.fullName
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
                  className={`block w-full px-4 py-3 border ${validationErrors.email
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
