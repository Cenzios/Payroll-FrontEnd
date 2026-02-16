import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, setAuthFromToken, setSelectedCompanyId } from '../store/slices/authSlice';
import {
  LogOut,
  Users,
  DollarSign,
  FileText,
  UserPlus,
  BarChart3,
  CreditCard,
  Plus,
  ChevronDown,
  Building2,
  Bell,
  PieChart
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickAction from '../components/QuickAction';
import SalaryPaidSummary from '../components/SalaryPaidSummary';
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
  apiSlice
} from '../store/apiSlice';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import NotificationDropdown, { Notification } from '../components/NotificationDropdown';
import CompanySwitcher from '../components/CompanySwitcher';
import { salaryApi } from '../api/salaryApi';

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

  const urlToken = searchParams.get('token');
  const isTokenPending = !!urlToken && urlToken !== token;

  // RTK Query hooks
  const { data: companies = [] } = useGetCompaniesQuery(undefined, {
    skip: !user || isTokenPending
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardSummaryQuery(selectedCompanyId || undefined, {
    skip: !user || isTokenPending,
  });

  const [lastMonthSalary, setLastMonthSalary] = useState(0);

  useEffect(() => {
    const fetchLastMonthSalary = async () => {
      if (selectedCompanyId) {
        try {
          const now = new Date();
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

          // For report API: using 1-indexed months
          // e.g., if now is Feb (1), last month is Jan (0). API expects 1 for Jan.
          // So lastMonthDate.getMonth() + 1 gives 1-based index.

          const response = await salaryApi.getSalaryReport(
            selectedCompanyId,
            lastMonthDate.getMonth() + 1, // Start Month
            lastMonthDate.getFullYear(), // Start Year
            lastMonthDate.getMonth() + 1, // End Month
            lastMonthDate.getFullYear()  // End Year
          );

          // The API returns monthlyData array. We need the total for that single month.
          // Assuming monthlyData[0] is what we need if array is not empty.
          const total = response.data?.monthlyData?.[0]?.totals?.totalNetPay || 0;
          setLastMonthSalary(total);
        } catch (error) {
          console.error("Failed to fetch last month salary:", error);
          setLastMonthSalary(0);
        }
      }
    };

    fetchLastMonthSalary();
  }, [selectedCompanyId]);

  const [createCompany] = useCreateCompanyMutation();
  const [createEmployee] = useCreateEmployeeMutation();

  const { data: dbNotifications = [] } = useGetNotificationsQuery(undefined, {
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
      confirmText: 'Update Plan',
      onConfirm: () => {
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
      } else {
        await createEmployee(data as CreateEmployeeRequest).unwrap();
        setToast({ message: 'Employee created successfully!', type: 'success' });
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      const errorMsg = error?.data?.message || 'Operation failed';
      if (errorMsg.includes('limit reached')) {
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">

            {/* LEFT */}
            <div>
              <h1 className="text-[28px] font-medium text-gray-900 leading-tight">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-[16px] font-normal text-gray-500 leading-[1.7]">
                Here's your dashboard overview
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

              {/* Company Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="
            flex items-center gap-2
            px-4 py-2
            rounded-xl
            border border-gray-200
            bg-white
            hover:bg-gray-50
            text-sm font-medium text-gray-700
          "
                >
                  <Building2 className="w-4 h-4 text-gray-500" />
                  {selectedCompany ? selectedCompany.name : 'Select Company'}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <CompanySwitcher
                  isOpen={isCompanyDropdownOpen}
                  onClose={() => setIsCompanyDropdownOpen(false)}
                  companies={companies}
                  selectedCompanyId={selectedCompanyId}
                  onSelectCompany={(id) => dispatch(setSelectedCompanyId(id))}
                  onAddNew={() => {
                    setIsCompanyDropdownOpen(false);
                    openAddCompany();
                  }}
                />
              </div>

              <button
                onClick={openAddCompany}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Company
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    const nextState = !isNotificationDropdownOpen;
                    setIsNotificationDropdownOpen(nextState);
                    if (nextState) {
                      handleMarkAsRead();
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center relative transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isNotificationDropdownOpen}
                  onClose={() => setIsNotificationDropdownOpen(false)}
                  notifications={uiNotifications}
                  onClearAll={handleClearAll}
                />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                  <div className="text-xs text-gray-500">{user?.role || 'Admin'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>

            </div>
          </div>
        </header>


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
                  title="Last Month Salary Paid"
                  value={`Rs ${lastMonthSalary.toLocaleString()}`}
                  showLastMonth={true}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Left (2/3) – Salary Paid Summary Chart */}
                <div className="">
                  <SalaryPaidSummary companyId={selectedCompanyId || ''} />
                </div>

                {/* Right (1/3) – Quick Actions */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                  <h2 className="text-[20px] font-bold text-gray-900 mb-6">
                    Quick Actions
                  </h2>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <QuickAction
                      icon={FileText}
                      title="Generate Payslips"
                      description="Create monthly payslips"
                      bgColor="bg-[#4182F9]"
                      lightBgColor="bg-[#EBF2FF]"
                      actionText="Generate Pay-slip"
                      onClick={() => navigate('/salary')}
                    />

                    <QuickAction
                      icon={UserPlus}
                      title="Add Employee"
                      description="Register new staff member"
                      bgColor="bg-[#00C292]"
                      lightBgColor="bg-[#E6FAF5]"
                      actionText="Add Employee"
                      onClick={openAddEmployee}
                    />

                    <QuickAction
                      icon={BarChart3}
                      title="View Reports"
                      description="Access detailed analytics"
                      bgColor="bg-[#FFB13A]"
                      lightBgColor="bg-[#FFF5E9]"
                      actionText="View Reports"
                      onClick={() => navigate('/reports')}
                    />

                    <QuickAction
                      icon={CreditCard}
                      title="Change Plan"
                      description="Change subscription plan"
                      bgColor="bg-[#9B8AFB]"
                      lightBgColor="bg-[#F1EFFF]"
                      actionText="Change Plan"
                      onClick={() => setIsAddonModalOpen(true)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <UniversalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        mode={drawerMode}
        companyId={selectedCompany?.id}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
      />

      <AddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Slots purchased successfully!', type: 'success' });
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
