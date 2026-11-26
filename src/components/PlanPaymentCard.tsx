import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import CheckoutForm from './CheckoutForm';
import axiosInstance from '../api/axios';
import { PLANS, getPlanById } from '../constants/plans';
import { Loader2 } from 'lucide-react';
import { isPositive, toDecimal, toMoneyString } from '../utils/money';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// ADDED: Props interface for PlanPaymentCard
interface PlanPaymentCardProps {
    pricePerEmployee?: string; // decimal string (API contract)
    employeeCount?: number;
    /** True only once the user picked Card and pressed "Proceed to Pay". */
    isActive?: boolean;
}

const PlanPaymentCard = ({ pricePerEmployee = '0', employeeCount = 1, isActive = false }: PlanPaymentCardProps): JSX.Element => {
    const [searchParams] = useSearchParams();
    const isPlanChange = searchParams.get('isPlanChange') === 'true';
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [isFetchingSub, setIsFetchingSub] = useState(true);

    // Stripe State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    const [intentError, setIntentError] = useState<string | null>(null);
    const [actualAmount, setActualAmount] = useState<string | null>(null);
    // One intent per plan per visit: never on mount, never on re-render
    const intentPlanRef = useRef<string | null>(null);

    // Get selected plan dynamically
    const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
    const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

    // Calculate total amount: pricePerEmployee * employeeCount (decimal.js, sent as string)
    const calculatedTotal = toMoneyString(toDecimal(pricePerEmployee).times(employeeCount));

    // Fetch current subscription from backend
    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                if (!isAuthenticated) return;

                const response = await axiosInstance.get('/subscription/current');

                setActiveSubscription(response.data.data);
            } catch (err) {
                console.error('❌ Failed to fetch subscription:', err);
            } finally {
                setIsFetchingSub(false);
            }
        };

        fetchSubscription();
    }, []);

    // Create the Payment Intent only after the user chose to pay by card (no payment rows before that)
    useEffect(() => {
        if (!isActive || !user || isFetchingSub) return;
        if (intentPlanRef.current === selectedPlan.id) return;
        intentPlanRef.current = selectedPlan.id;

        const createPaymentIntent = async () => {
            setIsLoadingSecret(true);
            setIntentError(null);
            try {
                if (!isAuthenticated) return;

                const planId = isPlanChange ? selectedPlan.id : (localStorage.getItem('reg_planId') || PLANS.BASIC.id);
                // Calculate the true amount based on the provided pricePerEmployee (e.g., 100) instead of the hardcoded default plan price
                const amount = calculatedTotal;

                console.log('📝 Creating Stripe Intent for Plan:', planId);

                const { data } = await axiosInstance.post('/payments/intents', {
                    planId,
                    amount,
                    currency: 'LKR'
                });

                if (data?.data?.clientSecret) {
                    setClientSecret(data.data.clientSecret);
                    const intentAmount: string | undefined = data?.data?.intent?.amount;
                    setActualAmount(isPositive(intentAmount) && intentAmount ? intentAmount : amount);
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
    }, [isActive, user, isFetchingSub, isPlanChange, selectedPlan.id]); // Dependencies

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col justify-center h-full min-h-[400px] max-sm:w-[22rem]">
            <div className="mb-6 text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Secure Payment via Stripe</h2>
                <p className="text-gray-600 text-sm">
                    Enter your card details to subscribe.
                </p>
            </div>

            <div className="flex-grow flex flex-col justify-center min-h-[220px]">
                {/* {isLoadingSecret || isFetchingSub ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600 font-medium">Preparing secure payment...</p>
                    </div>
                ) : */}
                {intentError ? (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                        {intentError}
                    </div>
                ) : clientSecret ? (
                    <div className="flex-grow flex flex-col justify-center">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                             <CheckoutForm amount={actualAmount ?? calculatedTotal} currency="LKR" />
                        </Elements>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default PlanPaymentCard;
