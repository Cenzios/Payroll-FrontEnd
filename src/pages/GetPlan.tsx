import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setAuthFromToken, setSignupEmail, setTempPlanId } from '../store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  role: string;
  email: string;
  fullName: string;
  iat: number;
  exp: number;
}

// ✅ Hard-coded Plan IDs (MUST USE EXACTLY)
const PLAN_IDS = {
  BASIC: "0f022c11-2a3c-49f5-9d11-30082882a8e9",
  PROFESSIONAL: "3a9f7d42-5b6a-4d6b-b3d2-9b4d6d5a1c21",
  ENTERPRISE: "9e1c4b2a-8d7f-4b9a-a5c2-2c3f4d6e7b88",
};

interface PlanCardProps {
  planName: string;
  planId: string;
  price: number;
  registrationFee: number;
  description: string;
  features: string[];
  isHighlighted?: boolean;
  onSelectPlan: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  planName,
  planId,
  price,
  registrationFee,
  description,
  features,
  isHighlighted = false,
  onSelectPlan
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${isHighlighted ? 'ring-4 ring-blue-500' : ''
      }`}>
      {/* Registration Fee Header */}
      <div className={`relative px-6 py-6 text-center text-white overflow-hidden ${isHighlighted
          ? 'bg-gradient-to-b from-[#4683fc] to-[#327be2]'
          : 'bg-gradient-to-b from-gray-400 to-gray-500'
        }`}>
        <div className={`absolute inset-0 ${isHighlighted ? 'bg-blue-400/30' : 'bg-gray-300/30'
          } blur-2xl opacity-60`}></div>

        <div className="relative z-10">
          <p className="text-sm font-medium mb-1">One-time Registration Fee</p>
          <p className="text-3xl font-bold">RS. {registrationFee.toLocaleString()}</p>
          <p className="text-sm mt-1 opacity-90">
            Charged in the first month only
          </p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="px-6 py-8">
        <div className="mb-5">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isHighlighted ? 'text-blue-600' : 'text-gray-600'
            }`}>
            {planName} PLAN
          </p>

          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold text-gray-900">RS: {price}</h2>
            <span className="text-gray-600 text-sm">per employee</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {description}
        </p>

        {/* Features List */}
        <div className="space-y-3 mb-7">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isHighlighted ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-gray-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Get the Plan Button */}
        <button
          onClick={() => onSelectPlan(planId)}
          className={`relative w-full font-semibold py-3.5 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] ${isHighlighted
              ? 'bg-gradient-to-r from-[#4683fc] to-[#327be2] text-white'
              : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
        >
          <span className={`absolute inset-0 ${isHighlighted ? 'bg-blue-400/40' : 'bg-gray-300/40'
            } blur-2xl opacity-70`}></span>
          <span className="relative z-10">Get the plan</span>
        </button>
      </div>
    </div>
  );
};

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

  // Plan configurations
  const plans = [
    {
      planName: 'Professional',
      planId: PLAN_IDS.PROFESSIONAL,
      price: 75,
      registrationFee: 5000,
      description: 'Get essential payroll features with basic plan. Pay only a one-time Rs. 5,000 registration fee in the first month. From the second month, your subscription is based on the number of employees—simple, flexible, and affordable.',
      features: [
        'Payroll processing for 30-50 employees',
        'Automatic salary & deduction calculations',
        'Monthly payslip generation (PDF / CSV / Excel)',
        'Employee profile management',
        'Manage multiple company',
        'Payroll report generations',
        'Secure dashboard for administrators',
      ],
      isHighlighted: false,
    },
    {
      planName: 'Basic',
      planId: PLAN_IDS.BASIC,
      price: 100,
      registrationFee: 2500,
      description: 'Get essential payroll features with basic plan. Pay only a one-time Rs. 2,500 registration fee in the first month. From the second month, your subscription is based on the number of employees—simple, flexible, and affordable.',
      features: [
        'Payroll processing for up to 0-29 employees',
        'Automatic salary & deduction calculations',
        'Monthly payslip generation (PDF / CSV / Excel)',
        'Employee profile management',
        'Manage multiple company',
        'Payroll report generations',
        'Secure dashboard for administrators',
      ],
      isHighlighted: true,
    },
    {
      planName: 'Enterprise',
      planId: PLAN_IDS.ENTERPRISE,
      price: 50,
      registrationFee: 7500,
      description: 'Get essential payroll features with basic plan. Pay only a one-time Rs. 7,500 registration fee in the first month. From the second month, your subscription is based on the number of employees—simple, flexible, and affordable.',
      features: [
        'Payroll processing for 100 or more employees',
        'Automatic salary & deduction calculations',
        'Monthly payslip generation (PDF / CSV / Excel)',
        'Employee profile management',
        'Manage multiple company',
        'Payroll report generations',
        'Secure dashboard for administrators',
      ],
      isHighlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12 relative z-10">
        Choose The Plan That's Right For You
      </h1>

      {/* Three Plan Cards */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {plans.map((plan) => (
          <PlanCard
            key={plan.planId}
            planName={plan.planName}
            planId={plan.planId}
            price={plan.price}
            registrationFee={plan.registrationFee}
            description={plan.description}
            features={plan.features}
            isHighlighted={plan.isHighlighted}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>
    </div>
  );
};

export default GetPlan;
