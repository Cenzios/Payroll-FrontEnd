import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import celebrationImg from '../assets/images/celebration-illustration.svg';
import bgIllustration from '../assets/images/Background-illustration.svg';
import axiosInstance from '../api/axios';
import { Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';



const Confirmation = () => {
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'verifying' | 'active' | 'failed'>('verifying');

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkSubscriptionAndCreateCompany = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          setStatus('failed');
          return;
        }

        const response = await axiosInstance.get('/subscription/current', {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const subStatus = response.data.data.status;

        if (subStatus === 'ACTIVE') {
          clearInterval(pollInterval);

          // ✅ PAYHERE SUCCESS! Now create the company if needed
          const tempCompanyName = localStorage.getItem('temp_companyName');

          if (tempCompanyName) {
            try {
              // Get email from token since we might have refreshed
              const decoded: any = jwtDecode(authToken);
              const userEmail = decoded.email;

              console.log('🏢 Creating company after payment:', tempCompanyName);

              await axiosInstance.post('/company', {
                name: tempCompanyName,
                email: userEmail || 'active@user.com',
                address: 'Not Provided',
                contactNumber: '',
                departments: []
              }, {
                headers: { Authorization: `Bearer ${authToken}` }
              });

              console.log('✅ Company created successfully');
              localStorage.removeItem('temp_companyName'); // Cleanup to prevent duplicates
            } catch (err) {
              console.error('⚠️ Activation success, but company creation failed:', err);
              // We proceed to success state anyway, user can create company later if needed
            }
          }

          setStatus('active');

          // ✅ AUTO REDIRECT TO DASHBOARD
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);

        } else if (subStatus === 'FAILED') {
          setStatus('failed');
          clearInterval(pollInterval);
          navigate('/confirmation-fail');
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    // Initial check
    checkSubscriptionAndCreateCompany();

    // Start polling every 3 seconds
    pollInterval = setInterval(checkSubscriptionAndCreateCompany, 3000);

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      if (status === 'verifying') {
        clearInterval(pollInterval);
        setStatus('failed');
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [navigate, status]); // Added status dependency

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }
      .confetti {
        position: absolute;
        width: 8px;
        height: 8px;
        animation: confetti-fall 3s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleContinue = () => {
    // ✅ Always go to Dashboard on success (User is already authenticated)
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="w-full max-lg relative z-10 flex justify-center">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg">
          <div className="px-8 py-12 text-center">
            {status === 'verifying' ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Verifying Payment
                </h1>
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <Loader2 className="w-32 h-32 text-blue-600 animate-spin relative z-10" />
                  </div>
                </div>
                <div className="mb-8 space-y-2 text-gray-600">
                  <p className="font-medium text-gray-700">Please wait while we confirm your payment with PayHere.</p>
                  <p>Do not close this window or press the back button.</p>
                </div>
              </>
            ) : status === 'active' ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Congratulations!
                </h1>

                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
                  <img
                    src={celebrationImg}
                    alt="Celebration"
                    className="w-64 h-64 mx-auto object-contain relative z-10"
                  />
                </div>

                <div className="mb-8 space-y-2">
                  <p className="text-gray-700 font-medium">
                    Your PayHere payment was successful!
                  </p>
                  <p className="text-gray-600">
                    and your Cenzios account is now active.
                  </p>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-red-600 mb-8">
                  Verification Timeout
                </h1>
                <div className="mb-8 space-y-2 text-gray-600">
                  <p>It's taking longer than expected to verify your payment.</p>
                  <p>If you've completed the payment, please check again or contact support.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setStatus('verifying'); // Reset status to restart polling
                    }}
                    className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-all duration-200"
                  >
                    Check Again
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 text-gray-600 font-semibold py-4 rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Background Illustration - Top Right */}
      <div className="
  absolute 
  top-[-250px] right-[-200px]
  w-[600px] h-[600px]
  z-0
  pointer-events-none
">
        <img
          src={bgIllustration}
          alt="Background Decoration"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Background Illustration - Bottom Left */}
      <div className="
  absolute 
  bottom-[-300px] left-[-200px]
  w-[700px] h-[700px]
  z-0
  pointer-events-none
">
        <img
          src={bgIllustration}
          alt="Background Decoration"
          className="w-full h-full object-contain rotate-180"
        />
      </div>
    </div >
  );
};

export default Confirmation;
