import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import visaIcon from '../assets/images/visa.svg';
import paypalIcon from '../assets/images/paypal.svg';
import mastercardIcon from '../assets/images/mastercard.svg';
import gpayIcon from '../assets/images/gpay.svg';
import axiosInstance from '../api/axios';
import PlanCard from '../components/PlanCard';
import { PLANS, getPlanById } from '../constants/plans';
import bgIllustration from '../assets/images/Background-illustration.svg';


const BuyPlan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPlanChange = searchParams.get('isPlanChange') === 'true'; // ✅ Detect plan change mode
  const { isLoading, error, signupEmail, user, token } = useAppSelector((state) => state.auth);

  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isFetchingSub, setIsFetchingSub] = useState(true);

  // ✅ Get selected plan dynamically
  const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
  const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

  // ✅ Fetch current subscription from backend
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        console.log('🔍 Fetching subscription from backend...');
        const response = await axiosInstance.get('/subscription/current', {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        setActiveSubscription(response.data.data);
        console.log('✅ Subscription fetched:', response.data.data);
      } catch (err) {
        console.error('❌ Failed to fetch subscription:', err);
      } finally {
        setIsFetchingSub(false);
      }
    };

    fetchSubscription();
  }, []);

  // ✅ Enforce Terms Acceptance
  useEffect(() => {
    const termsAccepted = localStorage.getItem('termsAccepted');
    if (termsAccepted !== 'true') {
      // Redirect if not accepted (pass flag)
      navigate(`/terms-and-conditions?isPlanChange=${isPlanChange}`, { replace: true });
    }
  }, [navigate]);

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

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) throw new Error('No auth token found');

      console.log('💳 Creating PayHere payment session...');
      const response = await axiosInstance.post('/subscription/create-payment-session', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const payload = response.data.data;
      console.log('🚀 Redirecting to PayHere Sandbox:', payload);

      // Create a hidden form and submit it
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payhere.lk/pay/checkout';

      Object.keys(payload).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

    } catch (error: any) {
      console.error('❌ Payment initialization failed:', error);
      alert(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden
  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
  flex items-center justify-center px-4 py-12"
    >

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>
      <div className="w-full max-w-5xl relative z-10">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          {isPlanChange ? 'Confirm Plan Change' : 'Complete Registration Payment'}
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {isFetchingSub ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Fetching plan details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Dynamic Plan Card - Shows Selected Plan */}
            <PlanCard
              planName={activeSubscription?.planName || selectedPlan.name}
              price={activeSubscription?.pricePerEmployee || selectedPlan.price}
              registrationFee={selectedPlan.registrationFee}
              description={selectedPlan.description}
              features={selectedPlan.features}
              isHighlighted={true}
              showButton={false}
            />

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
                    isPlanChange ? 'Confirm Change' : 'Next'
                  )}
                </button>

                <div className="flex justify-center gap-6 text-xs text-gray-500">
                  <button type="button" className="hover:text-gray-700">Instructions</button>
                  <button
                    type="button"
                    onClick={() => window.open('/terms-and-conditions', '_blank')}
                    className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Terms of Use
                  </button>
                  <button type="button" className="hover:text-gray-700">Privacy</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Background Wave - Bottom Right */}
      <div
        className="absolute bottom-[-350px] right-[-200px]
  w-[700px] h-[700px]
  z-0 pointer-events-none"
      >
        <img
          src={bgIllustration}
          alt="Background Wave"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default BuyPlan;