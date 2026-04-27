import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Loader2 } from 'lucide-react';
import axiosInstance from '../api/axios';
import PlanCard from '../components/PlanCard';
import { PLANS, getPlanById } from '../constants/plans';
import bgIllustration from '../assets/images/Background-illustration.svg';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const BuyPlan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPlanChange = searchParams.get('isPlanChange') === 'true';
  const { error: authError, user } = useAppSelector((state) => state.auth);

  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isFetchingSub, setIsFetchingSub] = useState(true);

  // Stripe State
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

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
      navigate(`/terms-and-conditions?isPlanChange=${isPlanChange}`, { replace: true });
    }
  }, [navigate]);

  // ✅ Create Payment Intent on Mount (or when plan/user is ready)
  useEffect(() => {
    if (!user || isFetchingSub) return;

    const createPaymentIntent = async () => {
      setIsLoadingSecret(true);
      setIntentError(null);
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        const planId = isPlanChange ? selectedPlan.id : (localStorage.getItem('reg_planId') || PLANS.BASIC.id);
        const amount = activeSubscription?.registrationFee || selectedPlan.registrationFee; // Use API fee if available

        console.log('📝 Creating Stripe Intent for Plan:', planId);

        const { data } = await axiosInstance.post('/payments/intents', {
          planId,
          amount,
          currency: 'LKR'
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (data?.data?.clientSecret) {
          setClientSecret(data.data.clientSecret);
          console.log('✅ Client Secret received');
        } else {
          throw new Error('No client secret returned');
        }

      } catch (err: any) {
        console.error('❌ Failed to create Payment Intent:', err);
        setIntentError(err.response?.data?.message || 'Failed to initialize payment.');
      } finally {
        setIsLoadingSecret(false);
      }
    };

    createPaymentIntent();
  }, [user, isFetchingSub, isPlanChange, selectedPlan.id]); // Dependencies

  return (
    <div
      className="relative min-h-screen overflow-y-auto  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
  flex items-center justify-center px-4 py-10 scroll-smooth"
    >

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>
      <div className="w-full max-w-5xl relative z-10">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          {isPlanChange ? 'Confirm Plan Change' : 'Complete Registration Payment'}
        </h1>

        {(authError || intentError) && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {authError || intentError}
          </div>
        )}

        {isFetchingSub || isLoadingSecret ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Preparing secure payment...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Dynamic Plan Card - Shows Selected Plan */}
            <PlanCard
              planName={activeSubscription?.planName || selectedPlan.name}
              price={activeSubscription?.pricePerEmployee || selectedPlan.employeePrice || selectedPlan.price}
              registrationFee={activeSubscription?.registrationFee || selectedPlan.registrationFee}
              description={selectedPlan.description}
              features={selectedPlan.features}
              showPerEmployeePrice={true}
              isHighlighted={true}
              showButton={false}
            />

            <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col">
              <div className="mb-4 text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Secure Payment via Stripe</h2>
                <p className="text-gray-600 text-sm">
                  Enter your card details to subscribe.
                </p>
              </div>

              {/* Stripe Elements Provider */}
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    amount={activeSubscription?.registrationFee || selectedPlan.registrationFee}
                    currency="LKR"
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Background Wave - Bottom Right */}
      {/* <div className="absolute bottom-[-350px] right-[-200px] w-[700px] h-[700px] z-0 pointer-events-none">
        <img
          src={bgIllustration}
          alt="Background Wave"
          className="w-full h-full object-contain"
        />
      </div> */}
    </div>
  );
};

export default BuyPlan;