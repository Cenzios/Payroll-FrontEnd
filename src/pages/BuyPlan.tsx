import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser, clearError } from '../store/slices/authSlice';
import { Check, Loader2 } from 'lucide-react';
import visaIcon from '../assets/images/visa.svg';
import paypalIcon from '../assets/images/paypal.svg';
import mastercardIcon from '../assets/images/mastercard.svg';
import gpayIcon from '../assets/images/gpay.svg';

const BuyPlan = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, signupEmail, tempPassword, tempPlanId } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    paymentMethod: 'visa',
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    saveCard: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });

  const features = [
    'Payroll processing for up to 10 employees',
    'Automatic salary & deduction calculations',
    'Monthly payslip generation (PDF/CSV/Excel)',
    'Employee profile management',
    'Manage multiple company',
    'Payroll report generations',
    'Secure dashboard for administrators',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateForm = () => {
    const errors = {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    };

    if (!formData.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }

    if (!formData.cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    }

    if (!formData.expiryDate.trim()) {
      errors.expiryDate = 'Expiry date is required';
    }

    if (!formData.cvc.trim()) {
      errors.cvc = 'CVC is required';
    }

    setValidationErrors(errors);
    return !errors.cardholderName && !errors.cardNumber && !errors.expiryDate && !errors.cvc;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (!signupEmail || !tempPassword || !tempPlanId) {
        console.error('Missing registration data', { signupEmail, tempPassword, tempPlanId });
        // Handle missing data error - maybe redirect to start?
        return;
      }

      const result = await dispatch(
        registerUser({
          email: signupEmail,
          password: tempPassword,
          planId: tempPlanId,
        })
      );

      if (registerUser.fulfilled.match(result)) {
        navigate('/confirmation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>
      <div className="w-full max-w-5xl relative z-10">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          Complete Registration Payment
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide mb-3 text-blue-100">
                BASIC PLAN
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-5xl font-bold">RS: 150</h2>
                <span className="text-blue-100">per employee</span>
              </div>
              <p className="text-sm text-blue-50 leading-relaxed">
                Get essential payroll features with basic plan. Pay only a one-time Rs. 2,500 registration fee in
                the first month. After that, the price of your subscription is based on the number of
                employees—simple, flexible, and affordable.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-white/90 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl px-4 py-2 text-center">
              <p className="text-gray-700 text-sm font-semibold">
                First Month Fee Rs. <span className="text-xl font-bold">2,500</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select payment method <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {['visa', 'paypal', 'mastercard', 'gpay'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: method }))}
                      className={`flex-1 border-2 rounded-xl px-4 py-4 bg-white flex items-center justify-center 
        transition-all shadow-sm
        ${formData.paymentMethod === method
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={
                          method === 'visa' ? visaIcon :
                            method === 'paypal' ? paypalIcon :
                              method === 'mastercard' ? mastercardIcon :
                                gpayIcon
                        }
                        alt={method}
                        className="h-8 w-auto object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder's name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${validationErrors.cardholderName
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Nimal Kumara"
                />
                {validationErrors.cardholderName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cardholderName}</p>
                )}
              </div>

              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Card number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${validationErrors.cardNumber
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="0000 0000 00"
                />
                {validationErrors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Card number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 border ${validationErrors.expiryDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="04/2027"
                  />
                  {validationErrors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-2">
                    CVC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    name="cvc"
                    value={formData.cvc}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 border ${validationErrors.cvc
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="123"
                  />
                  {validationErrors.cvc && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveCard"
                  name="saveCard"
                  checked={formData.saveCard}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveCard" className="ml-2 text-sm text-gray-600">
                  Save card details
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <button type="button" className="hover:text-gray-700">Instructions</button>
                <button type="button" className="hover:text-gray-700">Terms of Use</button>
                <button type="button" className="hover:text-gray-700">Privacy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyPlan;
