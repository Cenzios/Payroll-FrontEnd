import { useEffect, useState, useCallback, useRef } from 'react';
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
  Building2,
  Bell
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickAction from '../components/QuickAction';
import UniversalDrawer from '../components/UniversalDrawer';
import ConfirmationModal from '../components/ConfirmationModal';
import AddonModal from '../components/AddonModal';
import Toast from '../components/Toast';
import { CreateCompanyRequest } from '../types/company.types';
import { CreateEmployeeRequest } from '../types/employee.types';
import {
  useGetDashboardSummaryQuery,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useCreateEmployeeMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteAllNotificationsMutation,
  useGetSalaryTrendQuery,
  apiSlice
} from '../store/apiSlice';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import NotificationDropdown, { Notification } from '../components/NotificationDropdown';
import CompanySwitcher from '../components/CompanySwitcher';
import DashboardChart from '../components/DashboardChart';
import { PieChart } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user, selectedCompanyId, token } = useAppSelector((state) => state.auth);

  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'company' | 'employee'>('company');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [chartRange, setChartRange] = useState('yearly');

  const urlToken = searchParams.get('token');
  const isTokenPending = !!urlToken && urlToken !== token;

  // RTK Query hooks
  const { data: companies = [] } = useGetCompaniesQuery(undefined, {
    skip: !user || isTokenPending
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardSummaryQuery(selectedCompanyId || undefined, {
    skip: !user || isTokenPending,
  });

  const [createCompany] = useCreateCompanyMutation();
  const [createEmployee] = useCreateEmployeeMutation();

  const { data: dbNotifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !user || isTokenPending
  });

  const { data: salaryTrend = [], isLoading: isTrendLoading } = useGetSalaryTrendQuery({
    companyId: selectedCompanyId || undefined,
    range: chartRange
  }, {
    skip: !user || isTokenPending
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  // Derived state
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

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

  // Effect to set default selected company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      dispatch(setSelectedCompanyId(companies[0].id));
    } else if (companies.length > 0 && selectedCompanyId && !companies.find(c => c.id === selectedCompanyId)) {
      dispatch(setSelectedCompanyId(companies[0].id));
    }
  }, [companies, selectedCompanyId, dispatch]);

  // Map DB notifications to UI notifications
  const uiNotifications: Notification[] = dbNotifications.map(n => ({
    id: n.id,
    type: n.type === 'ERROR' ? 'alert' : n.type.toLowerCase() as 'info' | 'warning',
    message: n.message,
    timestamp: new Date(n.createdAt).toLocaleDateString(),
    read: n.isRead
  }));

  const unreadCount = uiNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = useCallback(async () => {
    // Mark all unread notifications as read on backend
    const unreadIds = dbNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    for (const id of unreadIds) {
      await markAsRead(id);
    }
  }, [dbNotifications, markAsRead]);

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications().unwrap();
      setIsNotificationDropdownOpen(false);
      setToast({ message: 'All notifications cleared', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to clear notifications', type: 'error' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  };

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const openLimitModal = (type: 'company' | 'employee', limit: number, current: number) => {
    setConfirmation({
      isOpen: true,
      type: 'warning',
      title: `${type === 'company' ? 'Companies' : 'Employees'} Limit Reached`,
      message: `You’ve reached the maximum number of ${type === 'company' ? 'Companies' : 'Employees'} allowed on your current plan. To add more ${type === 'company' ? 'Companies' : 'Employees'}, please ${type === 'company' ? 'upgrade your plan' : 'purchase more slots'}.`,
      confirmText: 'Update Plan', // Kept generic "Update Plan"
      onConfirm: () => {
        // For companies, go to settings. For employees, open AddonModal as it's about slots.
        if (type === 'company') {
          navigate('/settings?tab=subscription');
        } else {
          setIsAddonModalOpen(true);
        }
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (drawerMode === 'company') {
        await createCompany(data as CreateCompanyRequest).unwrap();
        setToast({ message: 'Company created successfully!', type: 'success' });
        // Refetch handled by cache invalidation tags
      } else {
        await createEmployee(data as CreateEmployeeRequest).unwrap();
        setToast({ message: 'Employee created successfully!', type: 'success' });
        // Refetch handled by cache invalidation tags
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      const errorMsg = error?.data?.message || 'Operation failed';
      if (errorMsg.includes('limit reached')) {
        // Parse limit if needed or just show generic message based on error
        // The error message from backend: "Company limit reached (2). Plan allows 2..."
        openLimitModal(drawerMode, 0, 0);
      } else {
        setToast({ message: errorMsg, type: 'error' });
      }
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
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">

            {/* LEFT */}
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-[15px] font-medium text-gray-400 mt-1">
                Here's your dashboard overview.
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-6">

              {/* Add New Company Button - Integrated into header */}
              <button
                onClick={openAddCompany}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Add New Company
                <Plus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                {/* Notification */}
                <div className="relative">
                  <button
                    onClick={() => {
                      const nextState = !isNotificationDropdownOpen;
                      setIsNotificationDropdownOpen(nextState);
                      if (nextState) {
                        handleMarkAsRead();
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                  >
                    <Bell className="w-6 h-6 text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={isNotificationDropdownOpen}
                    onClose={() => setIsNotificationDropdownOpen(false)}
                    notifications={uiNotifications}
                    onClearAll={handleClearAll}
                  />
                </div>

                {/* User Section */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                    {user?.fullName?.split(' ')[1]?.charAt(0).toUpperCase() || 'B'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900">
                        {selectedCompany ? selectedCompany.name : (user?.fullName || 'User')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {user?.role || 'Admin'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>


        {/* Dashboard Content */}
        <main className="p-8">
          {isDashboardLoading ? <DashboardSkeleton /> : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Users}
                  title="Total Employees"
                  value={dashboardData?.totalEmployees?.toString() || '0'}
                />
                <StatCard
                  icon={DollarSign}
                  title="Total Salary Paid"
                  value={`Rs ${dashboardData?.totalSalaryPaidThisMonth?.toLocaleString() || '0'}`}
                />
                <StatCard
                  icon={Plus}
                  title="Company EPF/ETF Amount"
                  value={`Rs ${((dashboardData?.totalCompanyEPF || 0) + (dashboardData?.totalCompanyETF || 0)).toLocaleString()}`}
                />
                <StatCard
                  icon={PieChart}
                  title="Total Employee EPF"
                  value={`Rs ${dashboardData?.totalEmployeeEPF?.toLocaleString() || '0'}`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left (2/3) – Chart */}
                <div className="lg:col-span-2 max-h-[450px]">
                  <DashboardChart
                    data={salaryTrend}
                    onRangeChange={setChartRange}
                    currentRange={chartRange}
                    isLoading={isTrendLoading}
                  />
                </div>

                {/* Right (1/3) – Quick Actions */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 h-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">Quick Actions</h2>

                    <div className="grid grid-cols-1 gap-6">
                      <QuickAction
                        icon={FileText}
                        title="Generate Payslips"
                        description="Create monthly payslips"
                        bgColor="bg-blue-50/30"
                        btnColor="bg-blue-600"
                        btnText="Generate Pay-slip"
                        onClick={() => navigate('/salary')}
                      />

                      <QuickAction
                        icon={UserPlus}
                        title="Add Employee"
                        description="Register new staff member"
                        bgColor="bg-emerald-50/30"
                        btnColor="bg-emerald-500"
                        btnText="Add Employee"
                        onClick={openAddEmployee}
                      />

                      <QuickAction
                        icon={BarChart3}
                        title="View Reports"
                        description="Access detailed analytics"
                        bgColor="bg-orange-50/30"
                        btnColor="bg-orange-400"
                        btnText="View Reports"
                        onClick={() => navigate('/reports')}
                      />

                      <QuickAction
                        icon={CreditCard}
                        title="Change Plan"
                        description="Change subscription plan"
                        bgColor="bg-purple-50/30"
                        btnColor="bg-purple-400"
                        btnText="Change Plan"
                        onClick={() => setIsAddonModalOpen(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
      />

      {/* Addon Modal */}
      <AddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Slots purchased successfully!', type: 'success' });
          // fetchSummary(); // Handled by tags
        }}
        onUpgradePlan={() => {
          setIsAddonModalOpen(false);
          navigate('/settings?tab=payment');
        }}
      />
    </div>
  );
};

export default Dashboard;
