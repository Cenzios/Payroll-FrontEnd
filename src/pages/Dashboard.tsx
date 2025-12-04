import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { LogOut, User, Mail, Shield } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Payroll Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome to Your Dashboard
          </h2>
          <p className="mt-2 text-gray-600">
            Manage your payroll and employee information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  User ID
                </span>
              </div>
              <p className="text-sm text-gray-600 break-all">{user?.id}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Email
                </span>
              </div>
              <p className="text-sm text-gray-900 font-medium break-all">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Role
                </span>
              </div>
              <p className="text-sm text-gray-900 font-medium uppercase">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-6 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md">
                View Employees
              </button>
              <button className="bg-gradient-to-r from-green-600 to-green-700 text-white font-medium px-6 py-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md">
                Process Payroll
              </button>
              <button className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium px-6 py-4 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-sm hover:shadow-md">
                View Reports
              </button>
              <button className="bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium px-6 py-4 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-sm hover:shadow-md">
                Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
