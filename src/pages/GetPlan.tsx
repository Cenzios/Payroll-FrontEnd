import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const GetPlan = () => {
  const navigate = useNavigate();

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
    navigate('/buy-plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Choose The Plan That's Right For You
        </h1>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-center text-white">
            <p className="text-sm font-medium mb-1">One-time Registration Fee</p>
            <p className="text-3xl font-bold">RS. 2,500</p>
            <p className="text-sm mt-1 text-blue-100">Charged at the first month only</p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                BASIC PLAN
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-bold text-gray-900">RS:100</h2>
                <span className="text-gray-600">per employee</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Get essential payroll features with basic plan. Pay only a one-time Rs. 2,500 registration fee in
              the first month. After that, the price of your subscription is based on the number of
              employees—simple, flexible, and affordable.
            </p>

            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleGetPlan}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get the plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetPlan;
