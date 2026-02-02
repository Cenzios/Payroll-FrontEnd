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
  apiSlice
} from '../store/apiSlice';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import NotificationDropdown, { Notification } from '../components/NotificationDropdown';
import CompanySwitcher from '../components/CompanySwitcher';

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
                    setIsCompanyDropdownOpen(false); // Close first
                    openAddCompany();
                  }}
                />
              </div>

              {/* Add New Company */}
              <button
                onClick={openAddCompany}
                className="
          flex items-center gap-2
          bg-blue-600 hover:bg-blue-700
          text-white
          px-4 py-2
          rounded-xl
          text-sm 
        "
              >
                <Plus className="w-4 h-4" />
                Add New Company
              </button>

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
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-gray-100 hover:bg-gray-200
                    flex items-center justify-center
                    relative
                    transition-colors
                  "
                >
                  <Bell className="w-5 h-5 text-gray-600" />

                  {/* Unread dot */}
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

              {/* User */}
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.fullName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role || 'Admin'}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>

            </div>
          </div>
        </header>


        {/* Dashboard Content */}
        <main className="p-0">
          {isDashboardLoading ? <DashboardSkeleton /> : (
            <div className="p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Users}
                  title="Total Employees"
                  value={dashboardData?.totalEmployees?.toString() || '0'}
                  subtitle="Current Company"
                />
                <StatCard
                  icon={DollarSign}
                  title="Total Salary Paid"
                  value={`Rs ${dashboardData?.totalSalaryPaidThisMonth?.toLocaleString() || '0'}`}
                  subtitle="This Month"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Company EPF/ETF Amount"
                  value={`Rs ${((dashboardData?.totalCompanyEPF || 0) + (dashboardData?.totalCompanyETF || 0)).toLocaleString()}`}
                  subtitle="This Month"
                />
                <StatCard
                  icon={CreditCard}
                  title="Total Employee EPF"
                  value={`Rs ${dashboardData?.totalEmployeeEPF?.toLocaleString() || '0'}`}
                  subtitle="This Month"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* LEFT – Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickAction
                  icon={FileText}
                  title="Generate Payslips"
                  description="Create monthly payslips"
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                  onClick={() => navigate('/salary')}
                />

                <div onClick={openAddEmployee}>
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
                  onClick={() => navigate('/reports')}
                />

                <div onClick={() => setIsAddonModalOpen(true)}>
                  <QuickAction
                    icon={CreditCard}
                    title="Change Plan"
                    description="Change subscription plan"
                    bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT – Employee Usage */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employee Usage
                  </h3>
                  <p className="text-sm text-gray-500">
                    Current Plan: {dashboardData?.planName || 'Professional'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {/* Center count */}
              <div className="text-center my-6">
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardData?.totalEmployees}/{dashboardData?.maxEmployees}
                </div>
                <div className="text-sm text-gray-500">
                  Employees
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((dashboardData?.totalEmployees || 0) / (dashboardData?.maxEmployees || 1)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Used / Remaining */}
              <div className="flex justify-between text-sm text-gray-600 mb-6">
                <span>{dashboardData?.totalEmployees} Used</span>
                <span>
                  {(dashboardData?.maxEmployees || 0) - (dashboardData?.totalEmployees || 0)} Remaining
                </span>
              </div>

              {/* Remaining slots */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Remaining Slots
                </span>
                <span className="text-lg font-bold text-orange-500">
                  {dashboardData?.remainingSlots} left
                </span>
              </div>

              {/* Action */}
              <button
                onClick={() => setIsAddonModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                Get More Slots
              </button>
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
