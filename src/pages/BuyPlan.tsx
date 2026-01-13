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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) throw new Error('No auth token found');

      // ------------------------------------------------------------------
      // ⭐ NEW START: Payment Intent Flow
      // ------------------------------------------------------------------
      const planToBuy = activeSubscription?.planName ? activeSubscription.planName : selectedPlan.name; // Logic if needed, but mainly we use IDs

      // 1. Create Payment Intent
      console.log('📝 Creating Payment Intent...');
      const intentRes = await axiosInstance.post('/payments/intents', {
        planId: isPlanChange ? selectedPlan.id : (localStorage.getItem('reg_planId') || PLANS.BASIC.id),
        amount: isPlanChange ? selectedPlan.price : selectedPlan.price, // Use correct price logic
        currency: 'LKR'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const intent = intentRes.data.data;
      console.log('✅ Intent Created:', intent.id);

      // 2. Get PayHere Payload for this Intent
      console.log('🔐 Fetching PayHere Payload...');
      const payloadRes = await axiosInstance.get(`/payments/intents/${intent.id}/payhere`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const payload = payloadRes.data.data;
      console.log('🚀 Redirecting to PayHere...', payload);

      // 3. Create Hidden Form & Submit
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payhere.lk/pay/checkout'; // Use sandbox for now as per previous code

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

            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col justify-center">
              <div className="mb-8 text-center space-y-4">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Secure Payment via PayHere</h2>
                <p className="text-gray-600">
                  You’ll be redirected to PayHere to complete your payment securely.
                  We do not store your card details.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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