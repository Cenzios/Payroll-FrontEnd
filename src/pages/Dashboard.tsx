import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, setAuthFromToken, setSelectedCompanyId } from '../store/slices/authSlice';
import {
  LogOut,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  UserPlus,
  BarChart3,
  CreditCard,
  Plus,
  ChevronDown,
  Building2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickAction from '../components/QuickAction';
import UniversalDrawer from '../components/UniversalDrawer';
import Toast from '../components/Toast';
import { companyApi } from '../api/companyApi';
import { employeeApi } from '../api/employeeApi';
import { dashboardApi } from '../api/dashboardApi';
import { Company, CreateCompanyRequest } from '../types/company.types';
import { CreateEmployeeRequest } from '../types/employee.types';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user, selectedCompanyId } = useAppSelector((state) => state.auth);

  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'company' | 'employee'>('company');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  // Derived state
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState<any>({
    totalEmployees: 0,
    totalSalaryPaidThisMonth: 0,
    totalCompanyETF: 0,
    totalEmployeeEPF: 0,
    remainingSlots: 0,
  });

  // Handle Google OAuth callback for existing users
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      try {
        dispatch(setAuthFromToken(token));
        window.history.replaceState({}, '', '/dashboard');
      } catch (error) {
        console.error('❌ Error processing OAuth token:', error);
      }
    }
  }, [searchParams, dispatch]);

  // Fetch Companies
  const fetchCompanies = async () => {
    try {
      const data = await companyApi.getCompanies();
      setCompanies(data);
      if (data.length > 0 && !selectedCompanyId) {
        dispatch(setSelectedCompanyId(data[0].id));
      } else if (data.length > 0 && selectedCompanyId && !data.find(c => c.id === selectedCompanyId)) {
        // If selected ID exists but provided company is not in the list (e.g. deleted/unauthorized), fallback to first
        dispatch(setSelectedCompanyId(data[0].id));
      }
    } catch (error) {
      console.error("Failed to load companies");
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  // Fetch Dashboard Summary
  const fetchSummary = async () => {
    try {
      const data = await dashboardApi.getSummary(selectedCompany?.id);
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load dashboard summary");
    }
  };

  useEffect(() => {
    if (user) { // Fetch global summary even if no company selected initially, or filter if company selected
      fetchSummary();
    }
  }, [selectedCompany, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawerMode === 'company') {
        await companyApi.createCompany(data as CreateCompanyRequest);
        setToast({ message: 'Company created successfully!', type: 'success' });
        fetchCompanies(); // Refresh list
      } else {
        await employeeApi.createEmployee(data as CreateEmployeeRequest);
        setToast({ message: 'Employee created successfully!', type: 'success' });
        fetchSummary(); // Refresh stats
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      setToast({ message: error.message || 'Operation failed', type: 'error' });
    }
  };

  const openAddCompany = () => {
    setDrawerMode('company');
    setIsDrawerOpen(true);
  };

  const openAddEmployee = () => {
    if (!selectedCompany) {
      setToast({ message: 'Please select a company first', type: 'error' });
      return;
    }
    setDrawerMode('employee');
    setIsDrawerOpen(true);
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

              {/* Company Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  <Building2 className="w-4 h-4 text-gray-500" />
                  {selectedCompany ? selectedCompany.name : "Select Company"}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isCompanyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => {
                          dispatch(setSelectedCompanyId(company.id));
                          setIsCompanyDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 text-sm flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {company.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsCompanyDropdownOpen(false);
                          openAddCompany();
                        }}
                        className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Company
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={openAddCompany}
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
              value={dashboardData.totalEmployees.toString()}
              subtitle="Current Company"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={DollarSign}
              title="Total Salary Paid"
              value={`Rs ${dashboardData.totalSalaryPaidThisMonth.toLocaleString()}`}
              subtitle="This Month"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              icon={TrendingUp}
              title="Company EPF Amount"
              value={`Rs ${dashboardData.totalCompanyETF?.toLocaleString() || '0'}`} // Note: using ETF field for now as per controller
              subtitle="This Month"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
            <StatCard
              icon={CreditCard}
              title="Total Employee EPF"
              value={`Rs ${dashboardData.totalEmployeeEPF.toLocaleString()}`}
              subtitle="This Month"
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
              <div onClick={openAddEmployee} className="cursor-pointer">
                <QuickAction
                  icon={UserPlus}
                  title="Add Employee"
                  description="Register new staff member"
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                />
              </div>
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
                <span className="text-sm text-gray-500">Current Plan ({dashboardData.planName || 'Unknown'})</span>
              </div>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  {/* Simple donut chart representation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{dashboardData.totalEmployees}/{dashboardData.maxEmployees || 0}</div>
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
                      strokeDasharray={`${(dashboardData.totalEmployees / (dashboardData.maxEmployees || 1)) * 502.4} 502.4`}
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
                  <div className="text-5xl font-bold text-orange-500 mb-2">{dashboardData.remainingSlots || 0} left</div>
                  <p className="text-sm text-gray-600 mb-6">
                    You can add {dashboardData.remainingSlots || 0} more employees to your current plan
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

      {/* Universal Drawer */}
      <UniversalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        mode={drawerMode}
        companyId={selectedCompany?.id}
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
