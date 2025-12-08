import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Confirmation = () => {
  const navigate = useNavigate();

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

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Congratulations!
            </h1>

            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
              <img
                src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Celebration"
                className="w-64 h-64 mx-auto object-cover rounded-full relative z-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-64 h-64 mx-auto bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center relative z-10';
                    placeholder.innerHTML = `
                      <div class="text-center">
                        <div class="text-6xl mb-4">🎉</div>
                        <div class="text-white font-bold text-2xl">Success!</div>
                      </div>
                    `;
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>

            <div className="mb-8 space-y-2">
              <p className="text-gray-700 font-medium">
                Your Stripe payment was successful!
              </p>
              <p className="text-gray-600">
                and your Cenzios company is just created.
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continue to Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
