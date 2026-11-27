import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ArrowLeft } from 'lucide-react';
import axiosInstance from '../api/axios';
import PlanCard from '../components/PlanCard';
import PlanOption from '../components/PlanOption';
import { PLANS, getPlanById } from '../constants/plans';
import { useUpdateSubscriptionEmployeeCountMutation, useGetDashboardSummaryQuery } from '../store/apiSlice';
import { isPositive } from '../utils/money';
import { isSettledActive, planBeingPurchased, type CurrentSubscription } from '../types/subscription.types';

const BuyPlan = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPlanChange = searchParams.get('isPlanChange') === 'true';
  const isRenewal = searchParams.get('isRenewal') === 'true';
  const { error: authError, isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeSubscription, setActiveSubscription] = useState<any>(null);

  const urlMethod = searchParams.get('method') as "card" | "manual" | "payhere" | null;
  const urlStep = searchParams.get('step') as "select" | "pay" | null;

  const [paymentMethod, setPaymentMethod] = useState<"card" | "manual" | "payhere" | null>(urlMethod);
  const [step, setStep] = useState<"select" | "pay">(urlStep || 'select');

  const [updateEmployeeCount] = useUpdateSubscriptionEmployeeCountMutation();

  const { selectedCompanyId } = useAppSelector((state) => state.auth);
  const { data: dashboardData } = useGetDashboardSummaryQuery(selectedCompanyId || undefined, {
    skip: !selectedCompanyId,
  });


  const [employeeCount, setEmployeeCount] = useState(1);

  useEffect(() => {
    if (activeSubscription?.usedEmployees) {
      setEmployeeCount(activeSubscription.usedEmployees);
      localStorage.setItem('paid_employee_limit', String(activeSubscription.usedEmployees));
    } else if (dashboardData?.totalEmployees) {
      setEmployeeCount(dashboardData.totalEmployees);
      localStorage.setItem('paid_employee_limit', String(dashboardData.totalEmployees));
    }
  }, [dashboardData?.totalEmployees, activeSubscription?.usedEmployees]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save: whenever employeeCount changes, persist it to the backend
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateEmployeeCount({ employeeCount }).catch((err) =>
        console.error('Failed to update employee count:', err)
      );
    }, 600);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [employeeCount]);


  const handleMethodChange = (method: "card" | "manual" | "payhere") => {
    setPaymentMethod(method);
    setSearchParams(prev => {
      prev.set('method', method);
      return prev;
    }, { replace: true });
  };

  const handleStepChange = (newStep: "select" | "pay") => {
    setStep(newStep);
    setSearchParams(prev => {
      prev.set('step', newStep);
      return prev;
    }, { replace: true });
  };

  const [isManualPending, setIsManualPending] = useState(false);

  // ✅ Get selected plan dynamically
  const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
  const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

  // Money is a decimal string (API contract). Old `a || b || c` fallbacks relied on 0 being
  // falsy; "0.0000" is truthy, so pick the first positive value explicitly.
  const subscriptionPrice: string | undefined = activeSubscription?.pricePerEmployee;
  const effectivePlanPrice: string =
    [subscriptionPrice, selectedPlan.employeePrice, selectedPlan.price].find((p) => isPositive(p)) ?? '0';
  const effectiveRegistrationFee: string =
    [activeSubscription?.registrationFee as string | undefined, selectedPlan.registrationFee].find((p) => isPositive(p)) ?? '0';

  // ✅ Fetch current subscription from backend
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!isAuthenticated) return;

        console.log('🔍 Fetching subscription from backend...');
        const response = await axiosInstance.get('/subscription/current');

        const sub = response.data.data as CurrentSubscription | null;
        // A plan change waiting for payment is what this page buys (not the current plan)
        setActiveSubscription(planBeingPurchased(sub));
        console.log('✅ Subscription fetched:', sub);

        // ✅ Prevent accessing /buy-plan if user already has an active subscription (e.g. Free Trial or completed payment)
        // Bypass this check if the user is explicitly changing plans or renewing an overdue plan
        if (isSettledActive(sub) && !isPlanChange && !isRenewal) {
          console.warn('User already has an ACTIVE subscription. Redirecting to dashboard.');
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error('❌ Failed to fetch subscription:', err);
      }
    };

    fetchSubscription();
  }, []);

  // ✅ Check for pending manual payments
  useEffect(() => {
    const checkManualPending = async () => {
      try {
        const { data } = await axiosInstance.get('/user-documents');
        const hasPending = data.data.some((doc: any) => doc.status === 'PENDING');
        if (hasPending) {
          setIsManualPending(true);
          setPaymentMethod('manual');
          setStep('pay');
          setSearchParams(prev => {
            prev.set('method', 'manual');
            prev.set('step', 'pay');
            return prev;
          }, { replace: true });
        }
      } catch (err) {
        console.warn('Failed to check manual payment status:', err);
      }
    };
    checkManualPending();
  }, []);

  // ✅ Enforce Terms Acceptance
  useEffect(() => {
    const termsAccepted = localStorage.getItem('termsAccepted');
    if (termsAccepted !== 'true') {
      navigate(`/terms-and-conditions?isPlanChange=${isPlanChange}`, { replace: true });
    }
  }, [navigate]);

  // No payment intent is created here: PlanPaymentCard creates one only after the
  // user picked Card and pressed "Proceed to Pay".
  const pendingInvoice = (activeSubscription as CurrentSubscription | null)?.pendingInvoice ?? null;

  return (
    <div
      className="relative min-h-screen overflow-y-auto  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-10 scroll-smooth">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>
      <div className="w-full max-w-5xl relative z-10 mx-auto">

        {/* Back Button - page level */}
        <button
          onClick={() => step === 'pay' ? handleStepChange('select') : navigate(isRenewal ? '/dashboard' : '/get-plan')}
          className="fixed top-8 left-20 flex items-center gap-1.5 text-sm text-blue-800 hover:text-blue-900 border-2 border-blue-200 hover:border-blue-900 hover:bg-blue-50 transition px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10 max-sm:text-3xl">
          {isPlanChange ? 'Confirm Plan Change' : 'Complete Registration Payment'}
        </h1>

        {authError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {authError}
          </div>
        )}

        {/* {isFetchingSub || isLoadingSecret ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Preparing secure payment...</p>
          </div>
        ) : ( */}
        <div className="grid grid-cols-[1fr_1fr] gap-10 items-stretch">
          {/* Dynamic Plan Card - Shows Selected Plan */}
          <div className='max-sm:hidden'>
            <PlanCard
              planName={activeSubscription?.planName || selectedPlan.name}
              price={effectivePlanPrice}
              registrationFee={effectiveRegistrationFee}
              description={selectedPlan.description}
              features={selectedPlan.features}
              maxEmployees={activeSubscription?.maxEmployees}
              showPerEmployeePrice={true}
              isHighlighted={true}
              showButton={false}
            />
          </div>

          <div>
            <PlanOption
              value={paymentMethod}
              onChange={handleMethodChange}
              step={step}
              onStepChange={handleStepChange}
              initialStep={isManualPending ? 'pay' : 'select'}
              pricePerEmployee={effectivePlanPrice}
              employeeCount={employeeCount}
              onEmployeeCountChange={setEmployeeCount}
              pendingInvoice={pendingInvoice}
            />
          </div>

          {/* <div className="bg-white rounded-[2.5rem] shadow-xl p-4 flex flex-col">
              <div className="mb-4 text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Secure Payment via Stripe</h2>
                <p className="text-gray-600 text-sm">
                  Enter your card details to subscribe.
                </p>
              </div> */}

          {/* Stripe Elements Provider */}
          {/* {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    amount={activeSubscription?.registrationFee || selectedPlan.registrationFee}
                    currency="LKR"
                  />
                </Elements>
              )}
            </div> */}
        </div>

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