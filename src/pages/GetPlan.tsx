import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken, setSignupEmail, setTempPlanId } from '../store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';
import PlanCard from '../components/PlanCard';
import { PLANS, getAllPlans } from '../constants/plans';

interface DecodedToken {
  userId: string;
  role: string;
  email: string;
  fullName: string;
  iat: number;
  exp: number;
}

const GetPlan = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      try {
        // Decode token to get user email
        const decoded = jwtDecode<DecodedToken>(token);

        // Set auth data in Redux
        dispatch(setAuthFromToken(token));

        // Set email for subscription flow
        if (decoded.email) {
          dispatch(setSignupEmail(decoded.email));
          console.log('✅ Google user email set:', decoded.email);
        }

        // Clean up URL
        window.history.replaceState({}, '', '/get-plan');
      } catch (error) {
        console.error('❌ Error processing OAuth token:', error);
      }
    }
  }, [searchParams, dispatch]);

  const handleSelectPlan = (planId: string) => {
    // ✅ Set plan ID in Redux
    dispatch(setTempPlanId(planId));

    // ✅ Also save to localStorage for persistence (following existing pattern)
    localStorage.setItem('reg_planId', planId);

    console.log('✅ Plan selected:', planId);

    // ✅ Navigate to buy-plan page
    navigate('/buy-plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12 relative z-10">
        Choose The Plan That's Right For You
      </h1>

      {/* Three Plan Cards */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {/* Professional Plan (Left - Highlighted) */}
        <PlanCard
          planName={PLANS.PROFESSIONAL.name}
          price={PLANS.PROFESSIONAL.price}
          registrationFee={PLANS.PROFESSIONAL.registrationFee}
          description={PLANS.PROFESSIONAL.description}
          features={PLANS.PROFESSIONAL.features}
          isHighlighted={false}
          showButton={true}
          onSelectPlan={() => handleSelectPlan(PLANS.PROFESSIONAL.id)}
        />

        {/* Basic Plan (Center - Highlighted) */}
        <PlanCard
          planName={PLANS.BASIC.name}
          price={PLANS.BASIC.price}
          registrationFee={PLANS.BASIC.registrationFee}
          description={PLANS.BASIC.description}
          features={PLANS.BASIC.features}
          isHighlighted={true}
          showButton={true}
          onSelectPlan={() => handleSelectPlan(PLANS.BASIC.id)}
        />

        {/* Enterprise Plan (Right) */}
        <PlanCard
          planName={PLANS.ENTERPRISE.name}
          price={PLANS.ENTERPRISE.price}
          registrationFee={PLANS.ENTERPRISE.registrationFee}
          description={PLANS.ENTERPRISE.description}
          features={PLANS.ENTERPRISE.features}
          isHighlighted={false}
          showButton={true}
          onSelectPlan={() => handleSelectPlan(PLANS.ENTERPRISE.id)}
        />
      </div>
    </div>
  );
};

export default GetPlan;
