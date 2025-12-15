import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, setAuthFromToken } from '../store/slices/authSlice';
import {
  LogOut,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  UserPlus,
  BarChart3,
  CreditCard,
  Plus
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickAction from '../components/QuickAction';
import AddCompanyDrawer from '../components/AddCompanyDrawer';
import Toast from '../components/Toast';
import { companyApi } from '../api/companyApi';
import { CreateCompanyRequest } from '../types/company.types';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle Google OAuth callback for existing users
  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      try {
        dispatch(setAuthFromToken(token));
        console.log('✅ Existing Google user authenticated');
        window.history.replaceState({}, '', '/dashboard');
      } catch (error) {
        console.error('❌ Error processing OAuth token:', error);
      }
    }
  }, [searchParams, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAddCompany = async (data: CreateCompanyRequest) => {
    try {
      await companyApi.createCompany(data);
      setToast({ message: 'Company created successfully!', type: 'success' });
      setIsDrawerOpen(false);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create company', type: 'error' });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user?.fullName?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Here's your dashboard overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Company
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">{user?.role || 'Admin'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Employees"
              value="10"
              subtitle="Latest Month"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={DollarSign}
              title="Total Salary Paid"
              value="Rs 123,000"
              subtitle="Latest Month"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              icon={TrendingUp}
              title="Company EPF/ETF Amount"
              value="Rs 15000"
              subtitle="Latest Month"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
            <StatCard
              icon={CreditCard}
              title="Total Employee EPF"
              value="Rs 70,000"
              subtitle="Latest Month"
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickAction
                icon={FileText}
                title="Generate Payslips"
                description="Create monthly payslips"
                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <QuickAction
                icon={UserPlus}
                title="Add Employee"
                description="Register new staff member"
                bgColor="bg-gradient-to-br from-green-500 to-green-600"
              />
              <QuickAction
                icon={BarChart3}
                title="View Reports"
                description="Access detailed analytics"
                bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <QuickAction
                icon={CreditCard}
                title="Change Plan"
                description="Change subscription plan"
                bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
              />
            </div>
          </div>

          {/* Employee Usage Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Employee Usage</h3>
                <span className="text-sm text-gray-500">Current Plan (Professional)</span>
              </div>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  {/* Simple donut chart representation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">8/10</div>
                      <div className="text-sm text-gray-500 mt-1">Employees</div>
                    </div>
                  </div>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#E5E7EB"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#F59E0B"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(8 / 10) * 502.4} 502.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Remaining Slots</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-orange-500 mb-2">2 left</div>
                  <p className="text-sm text-gray-600 mb-6">
                    You can add 2 more employees to your current plan
                  </p>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Get More Slots
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Company Drawer */}
      <AddCompanyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleAddCompany}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
