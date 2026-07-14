import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 - Page Not Found';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-8 max-w-md">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
          <p className="text-gray-500">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;