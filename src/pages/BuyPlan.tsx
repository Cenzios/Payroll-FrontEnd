import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Check, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import visaIcon from '../assets/images/visa.svg';
import paypalIcon from '../assets/images/paypal.svg';
import mastercardIcon from '../assets/images/mastercard.svg';
import gpayIcon from '../assets/images/gpay.svg';
import axiosInstance from '../api/axios';

const BuyPlan = () => {



  const navigate = useNavigate();
  const { isLoading, error, signupEmail, user, token } = useAppSelector((state) => state.auth);

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

    if (!validateForm()) return;

    // ✅ Try multiple sources for email (supports both normal and Google OAuth users)
    let userEmail = signupEmail;

    if (!userEmail && user?.email) {
      // Fallback 1: Get from user object (Google OAuth users)
      userEmail = user.email;
      console.log('📧 Using email from user object:', userEmail);
    }

    if (!userEmail && token) {
      // Fallback 2: Decode token to get email
      try {
        const decoded: any = jwtDecode(token);
        userEmail = decoded.email;
        console.log('📧 Using email from token:', userEmail);
      } catch (error) {
        console.error('❌ Error decoding token:', error);
      }
    }

    if (!userEmail) {
      console.error('❌ Missing subscription email', { signupEmail, user, token });
      alert('Unable to determine user email. Please try logging in again.');
      return;
    }


    try {
      // ✅ Get selected plan ID from localStorage (set in GetPlan page)
      const selectedPlanId = localStorage.getItem('reg_planId') || '0f022c11-2a3c-49f5-9d11-30082882a8e9'; // Fallback to Basic plan

      console.log('📤 Creating subscription for:', userEmail);
      console.log('📋 Selected Plan ID:', selectedPlanId);

      await axiosInstance.post('/subscription/subscribe', {
        email: userEmail,
        planId: selectedPlanId,
      });


      // ✅ 2. Create Company (ONLY if payment succeeded)
      const tempCompanyName = localStorage.getItem('temp_companyName');

      if (tempCompanyName) {
        try {
          console.log('🏢 Creating company:', tempCompanyName);
          // Assuming companyApi is imported or available via axios
          // We'll use axios directly here if companyApi isn't easily reachable, 
          // but better to use the import if possible. 
          // Let's stick to the plan: call companyApi.createCompany

          // Wait a bit to ensure subscription is propagated
          await new Promise(resolve => setTimeout(resolve, 500));

          await axiosInstance.post('/company', {
            name: tempCompanyName,
            email: userEmail || 'active@user.com',
            address: 'Not Provided',
            contactNumber: '',
            departments: []
          });

          console.log('✅ Company created successfully');
          localStorage.removeItem('temp_companyName'); // Cleanup
        } catch (companyError) {
          console.error('⚠️ Payment success, but company creation failed:', companyError);
          // We generally continue to confirmation so they don't get stuck, 
          // or we could show a distinct error. 
          // Requirement: "Redirect user to dashboard" (via confirmation usually)
        }
      }

      navigate('/confirmation');
    } catch (error: any) {
      console.error('❌ Subscription failed:', error);
      navigate('/confirmation-fail');
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
                  onChange={(e) => {
                    let value = e.target.value;

                    // ✅ Allow only letters and spaces
                    value = value.replace(/[^a-zA-Z\s]/g, '');

                    // ✅ Auto-capitalize each word (optional pro UX)
                    value = value.replace(/\b\w/g, (char) => char.toUpperCase());

                    // ✅ Max length 30 characters
                    value = value.slice(0, 30);

                    setFormData((prev) => ({ ...prev, cardholderName: value }));
                    setValidationErrors((prev) => ({ ...prev, cardholderName: '' }));
                  }}
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
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // ✅ Only digits
                    value = value.slice(0, 16); // ✅ Max 16 digits

                    // ✅ Auto add space every 4 digits
                    const formatted = value.replace(/(.{4})/g, '$1 ').trim();

                    // ✅ AUTO-DETECT CARD TYPE
                    let detectedType = formData.paymentMethod;

                    if (value.startsWith('4')) {
                      detectedType = 'visa';
                    }
                    else if (
                      /^(5[1-5])/.test(value) || // 51–55
                      /^(222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(value) // 2221–2720
                    ) {
                      detectedType = 'mastercard';
                    }

                    setFormData((prev) => ({
                      ...prev,
                      cardNumber: formatted,
                      paymentMethod: detectedType, // ✅ Auto switch icon
                    }));

                    setValidationErrors((prev) => ({ ...prev, cardNumber: '' }));
                  }}
                  className={`block w-full px-4 py-3 border ${validationErrors.cardNumber
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="5647 8795 2134 6548"
                  maxLength={19}
                />
                {validationErrors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // ✅ Only digits
                      value = value.slice(0, 6); // ✅ Max 6 digits (MMYYYY)

                      // ✅ Auto insert slash
                      if (value.length >= 3) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }

                      let error = '';

                      // ✅ MONTH VALIDATION (01–12)
                      if (value.length >= 2) {
                        const month = Number(value.slice(0, 2));
                        if (month < 1 || month > 12) {
                          error = 'Invalid month';
                        }
                      }

                      // ✅ YEAR REALISTIC LIMIT (CURRENT → +20 YEARS)
                      if (value.length === 7) {
                        const [monthStr, yearStr] = value.split('/');
                        const month = Number(monthStr);
                        const year = Number(yearStr);

                        const now = new Date();
                        const currentMonth = now.getMonth() + 1;
                        const currentYear = now.getFullYear();
                        const maxYear = currentYear + 20; // ✅ YOU CAN CHANGE 20 IF YOU WANT

                        if (year < currentYear || (year === currentYear && month < currentMonth)) {
                          error = 'Card is expired';
                        } else if (year > maxYear) {
                          error = `Year cannot be after ${maxYear}`;
                        }
                      }

                      setFormData((prev) => ({ ...prev, expiryDate: value }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        expiryDate: error,
                      }));
                    }}
                    className={`block w-full px-4 py-3 border ${validationErrors.expiryDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="MM/YYYY"
                    maxLength={7}
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setFormData(prev => ({ ...prev, cvc: value }));
                      setValidationErrors(prev => ({ ...prev, cvc: '' }));
                    }}
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