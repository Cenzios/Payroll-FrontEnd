import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import CheckoutForm from './CheckoutForm';
import axiosInstance from '../api/axios';
import { PLANS, getPlanById } from '../constants/plans';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PlanPaymentCard = () => {
    const [searchParams] = useSearchParams();
    const isPlanChange = searchParams.get('isPlanChange') === 'true';
    const { user } = useAppSelector((state) => state.auth);

    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [isFetchingSub, setIsFetchingSub] = useState(true);

    // Stripe State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [intentError, setIntentError] = useState<string | null>(null);

    // Get selected plan dynamically
    const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
    const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

    // Fetch current subscription from backend
    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const authToken = localStorage.getItem('token');
                if (!authToken) return;

                const response = await axiosInstance.get('/subscription/current', {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                setActiveSubscription(response.data.data);
            } catch (err) {
                console.error('❌ Failed to fetch subscription:', err);
            } finally {
                setIsFetchingSub(false);
            }
        };

        fetchSubscription();
    }, []);

    // Create Payment Intent on Mount (or when plan/user is ready)
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
                    console.log('Client Secret received');
                } else {
                    throw new Error('No client secret returned');
                }

            } catch (err: any) {
                console.error('Failed to create Payment Intent:', err);
                setIntentError(err.response?.data?.message || 'Failed to initialize payment.');
            } finally {
                setIsLoadingSecret(false);
            }
        };

        createPaymentIntent();
    }, [user, isFetchingSub, isPlanChange, selectedPlan.id, activeSubscription?.registrationFee, selectedPlan.registrationFee]); // Dependencies

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col justify-center h-full min-h-[400px]">
            <div className="mb-6 text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Secure Payment via Stripe</h2>
                <p className="text-gray-600 text-sm">
                    Enter your card details to subscribe.
                </p>
            </div>

            {isLoadingSecret || isFetchingSub ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600 font-medium">Preparing secure payment...</p>
                </div>
            ) : intentError ? (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                    {intentError}
                </div>
            ) : clientSecret ? (
                <div className="flex-grow flex flex-col justify-center">
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm amount={activeSubscription?.registrationFee || selectedPlan.registrationFee} currency="LKR" />
                    </Elements>
                </div>
            ) : null}
        </div>
    );
};

export default PlanPaymentCard;
