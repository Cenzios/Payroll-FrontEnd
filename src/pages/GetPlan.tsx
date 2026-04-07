import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken, setSignupEmail, setTempPlanId } from '../store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axios';
import PlanCard from '../components/PlanCard';
import { PLANS, Plan } from '../constants/plans';
import bgIllustration from '../assets/images/Background-illustration.svg';

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

  const [apiPlans, setApiPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get('/plans'); // Assuming this endpoint exists or should be created
        if (response.data.success) {
          setApiPlans(response.data.data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch plans:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    try {
      // ✅ Get token for authenticated request
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No auth token found. Please login.');
        navigate('/login');
        return;
      }

      // ✅ Secure plan selection via backend
      console.log('📤 Selecting plan via backend:', planId);

      const response = await axiosInstance.post(
        '/subscription/select-plan',
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Backend plan selection success:', response.data);

      // ✅ Set plan ID in Redux (keep for UI sync)
      dispatch(setTempPlanId(planId));

      // ✅ Save subscription data to localStorage for persistence
      localStorage.setItem('subscriptionId', response.data.data.subscriptionId);
      localStorage.setItem('reg_planId', planId);

      // ✅ Check if we are in "Change Plan" mode
      const isPlanChange = searchParams.get('isPlanChange') === 'true';

      // ✅ Navigate to terms-and-conditions page (pass the flag forward)
      navigate(`/terms-and-conditions?isPlanChange=${isPlanChange}`);
    } catch (error: any) {
      console.error('❌ Failed to select plan:', error);
      alert(error.response?.data?.message || 'Plan selection failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Map API plans to their respective slots by name or ID, merging pricing only
  const mergePlanDetails = (localPlan: any) => {
    const apiPlan = apiPlans.find(p => p.id === localPlan.id);
    return {
      ...localPlan,
      employeePrice: apiPlan?.employeePrice || localPlan.employeePrice || localPlan.price,
      registrationFee: apiPlan?.registrationFee || localPlan.registrationFee,
    };
  };

  const basicPlan = mergePlanDetails(PLANS.BASIC);

  return (
    <div className="min-h-screen relative overflow-hidden 
  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
  flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12 relative z-10">
        Choose The Plan That's Right For You
      </h1>

      {/* Single Plan Card (Basic) */}
      <div className="w-full max-w-lg mx-auto relative z-10 flex justify-center">
        <PlanCard
          planName={basicPlan.name}
          price={basicPlan.employeePrice || basicPlan.price}
          registrationFee={basicPlan.registrationFee}
          description={basicPlan.description}
          features={basicPlan.features}
          isHighlighted={true}
          showButton={true}
          showPerEmployeePrice={true}
          onSelectPlan={() => handleSelectPlan(basicPlan.id)}
        />
      </div>
      {/* Background Wave - Bottom Right */}
      <div className="absolute bottom-[-350px] right-[-200px] 
                w-[700px] h-[700px] 
                z-0 pointer-events-none">
        <img
          src={bgIllustration}
          alt="Background Wave"
          className="w-full h-full object-contain rotate-0"
        />
      </div>
    </div>
  );
};

export default GetPlan;
