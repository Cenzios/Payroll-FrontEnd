import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const GetPlan = () => {
  const navigate = useNavigate();
  const BASIC_PLAN_ID = '0f022c11-2a3c-49f5-9d11-30082882a8e9';

  const features = [
    'Payroll processing for up to 10 employees',
    'Automatic salary & deduction calculations',
    'Monthly payslip generation (PDF/CSV/Excel)',
    'Employee profile management',
    'Manage multiple company',
    'Payroll report generations',
    'Secure dashboard for administrators',
  ];

  const handleGetPlan = () => {
    localStorage.setItem('reg_planId', BASIC_PLAN_ID);
    navigate('/buy-plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

      {/* ✅ TITLE — ON BACKGROUND, PERFECTLY CENTERED */}
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12 whitespace-nowrap sm:whitespace-normal">
        Choose The Plan That's Right For You
      </h1>

      {/* ✅ CARD — SMALLER WIDTH LIKE YOUR IMAGE */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* ✅ TOP BLUE PRICE BAR WITH GLOW */}
        <div className="relative bg-gradient-to-b from-[#4683fc] to-[#327be2] px-6 py-6 text-center text-white overflow-hidden">

          {/* ✅ GLOW LAYER */}
          <div className="absolute inset-0 bg-blue-400/30 blur-2xl opacity-60"></div>

          {/* ✅ TEXT ABOVE GLOW */}
          <div className="relative z-10">
            <p className="text-sm font-medium mb-1">One-time Registration Fee</p>
            <p className="text-3xl font-bold">RS. 2,500</p>
            <p className="text-sm mt-1 text-blue-100">
              Charged at the first month only
            </p>
          </div>
        </div>

        {/* ✅ CARD BODY */}
        <div className="px-6 py-8">
          <div className="mb-5">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
              BASIC PLAN
            </p>

            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-gray-900">RS:100</h2>
              <span className="text-gray-600 text-sm">per employee</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Get essential payroll features with basic plan. Pay only a one-time Rs. 2,500
            registration fee in the first month. After that, the price of your subscription
            is based on the number of employees—simple, flexible, and affordable.
          </p>

          {/* ✅ FEATURES */}
          <div className="space-y-3 mb-7">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* ✅ BUTTON */}
          <button
            onClick={handleGetPlan}
            className="relative w-full bg-gradient-to-r from-[#4683fc] to-[#327be2] text-white font-semibold py-3.5 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
          >
            {/* ✅ GLOW LAYER */}
            <span className="absolute inset-0 bg-blue-400/40 blur-2xl opacity-70"></span>

            {/* ✅ BUTTON TEXT */}
            <span className="relative z-10">Get the plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetPlan;
