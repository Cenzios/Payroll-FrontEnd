import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken, setSignupEmail, setTempPlanId } from '../store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axios';
import PlanCard from '../components/PlanCard';
import ContactModal from '../components/ContactModal';
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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isProcessingPlan, setIsProcessingPlan] = useState(false);

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
    setIsProcessingPlan(true);
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
    } finally {
      setIsProcessingPlan(false);
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
  flex flex-col items-center justify-center px-4 py-8">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-bold text-center text-[#0E1D44] mb-3 relative z-10">
          Choose The Plan That's Right For You
        </h1>
        <p className="text-[#53616A] mt-3 text-sm md:text-base">
          Simple, transparent pricing — one fixed plan or fully tailored to your needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl relative z-10">
        {/* Single Plan Card (Basic) */}
        <div className="w-full max-w-[400px] mx-auto relative z-10 flex flex-col items-center">
          <PlanCard
            planName="PROFESSIONAL"
            price={basicPlan.employeePrice || basicPlan.price}
            description={basicPlan.description}
            features={basicPlan.features}
            isHighlighted={true}
            showButton={true}
            isLoading={isProcessingPlan}
            onSelectPlan={() => handleSelectPlan(basicPlan.id)}
          />

          {/* Contact Footer Bar */}
          {/* <div className="bg-white/80 backdrop-blur-md rounded-3xl px-10 py-5 shadow-xl border border-white/50 flex flex-col sm:flex-row items-center gap-6 sm:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-gray-500 text-[13px] font-medium">
            If you want a <span className="text-gray-900 font-bold">customize plan</span>, please contact us.
          </p>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="bg-[#4E8DFF] hover:bg-[#3B7BDE] text-white text-sm font-bold px-10 py-3 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
          >
            Contact us
          </button>
        </div> */}
        </div>

        <div>
          {/*cutom plan */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 max-w-[400px]">
            <div className="bg-gradient-to-r from-[#2563EB] to-[#153885] text-white p-8 py-8">
              <p className="text-xs tracking-widest opacity-80">CUSTOM PLAN</p>
              <h2 className="text-[50px] font-bold mt-6">Let's talk</h2>
              <p className="text-xs font-light flex items-start text-white mt-2">
                Tailored pricing for your business size & needs
              </p>
            </div>

            <div className="px-9 pt-7 pb-5 space-y-4 text-[13px] text-[#334155]">
              <p className="text-[13px] opacity-90">
                Everything in the Professional plan, plus features
                built around your specific requirements:
              </p>

              {[
                "Unlimited employees",
                "Custom integration",
                "Dedicated support",
                "SLA guarantee",
                "Custom reports",
                "On-boarding assistance",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <div className="w-4 h-4 rounded-full bg-[#255DAD] flex items-center justify-center shrink-0 shadow-lg shadow-blue-100 transition-transform group-hover:scale-110">
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                  </div>
                  <span className="text-[#334155] text-[13px] font-medium leading-tight">{feature}</span>
                </div>
              ))}

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="w-full text-[15px] bg-gradient-to-r from-[#2348AA] to-[#153885] mb-5 text-white font-bold py-3 rounded-[2rem] shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Background Wave - Bottom Right */}
      {/* <div className="absolute bottom-[-350px] right-[-200px] 
                w-[700px] h-[700px] 
                z-0 pointer-events-none">
        <img
          src={bgIllustration}
          alt="Background Wave"
          className="w-full h-full object-contain rotate-0"
        />
      </div> */}
    </div>
  );
};

export default GetPlan;
