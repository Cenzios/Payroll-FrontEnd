import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, setAuthFromToken, setSelectedCompanyId } from '../store/slices/authSlice';
import {
  Users,
  DollarSign,
  FileText,
  UserPlus,
  BarChart3,
  CreditCard,
  Plus,
  PieChart,
  ChevronDown,
  Building2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickAction from '../components/QuickAction';
import SalaryPaidSummary from '../components/SalaryPaidSummary';
import UniversalDrawer from '../components/UniversalDrawer';

// import SuccessModal from '../components/SuccessModal';
// import Employees from './Employees';

import ConfirmationModal from '../components/ConfirmationModal';
import AddonModal from '../components/AddonModal';
import Toast from '../components/Toast';
import { CreateCompanyRequest } from '../types/company.types';
import { CreateEmployeeRequest } from '../types/employee.types';
import {
  useGetDashboardSummaryQuery,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useCreateEmployeeMutation
} from '../store/apiSlice';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import CompanySwitcher from '../components/CompanySwitcher';
import PageHeader from '../components/PageHeader';
import { salaryApi } from '../api/salaryApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user, selectedCompanyId, token } = useAppSelector((state) => state.auth);

  // State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'company' | 'employee'>('company');

  // company pop up related
  // const [showSuccessModal, setShowSuccessModal] = useState(false);
  // const [modalTitle, setModalTitle] = useState("");
  // const [modalMessage, setModalMessage] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error'
  } | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  const urlToken = searchParams.get('token');
  const isTokenPending = !!urlToken && urlToken !== token;

  // RTK Query hooks
  const { data: companies = [] } = useGetCompaniesQuery(undefined, {
    skip: !user || isTokenPending
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardSummaryQuery(selectedCompanyId || undefined, {
    skip: !user || isTokenPending,
  });

  const { data: lastMonthSalary = 0 } = useQuery({
    queryKey: ['lastMonthSalary', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return 0;
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const response = await salaryApi.getSalaryReport(
        selectedCompanyId,
        lastMonthDate.getMonth() + 1,
        lastMonthDate.getFullYear(),
        lastMonthDate.getMonth() + 1,
        lastMonthDate.getFullYear()
      );

      return response.data?.monthlyData?.[0]?.totals?.totalNetPay || 0;
    },
    enabled: !!selectedCompanyId,
  });

  const [createCompany] = useCreateCompanyMutation();
  const [createEmployee] = useCreateEmployeeMutation();

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

  const openLimitModal = (type: 'company' | 'employee') => {
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

        // setModalTitle("Company Created");
        // setModalMessage(
        //   "You have successfully created a company.",
        // );
        // setShowSuccessModal(true);

      } else {
        await createEmployee(data as CreateEmployeeRequest).unwrap();
        setToast({ message: 'Employee created successfully!', type: 'success' });
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      let errorMsg = error?.data?.message || 'Operation failed';

      // Specifically handle duplicate NIC error for shorter message
      if (errorMsg === "Employee with this NIC already exists in this company") {
        errorMsg = "NIC already exists in this company";
      }

      if (errorMsg.includes('limit reached')) {
        openLimitModal(drawerMode);
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
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
        <PageHeader
          title={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'User'}`}
          subtitle="Here's Your Dashboard Overview"
          showLogout={true}
          actionElement={
            <>
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
                  {selectedCompany?.name
                    ? selectedCompany.name.split(' ').slice(0, 2).join(' ') + ' ...'
                    : 'Select Company'}
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

              {/* add employee button */}
              <button
                onClick={() => {
                  if (!selectedCompanyId) {
                    setToast({
                      message: "Please select a company from the Dashboard first.",
                      type: "error",
                    });
                    return;
                  }
                  openAddEmployee();
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                title={!selectedCompanyId ? "Please select a company from the Dashboard first" : ""}
              >
                <span className="hidden sm:inline whitespace-nowrap">Add New Employee</span>
                <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* add company button */}
              <button
                onClick={openAddCompany}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                title="Add New Company"
              >
                <span className="hidden sm:inline whitespace-nowrap">Add New Company</span>
                <span className="sm:hidden whitespace-nowrap">Add</span>
                <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                  <Plus className="w-4 h-4" />
                </div>
              </button>


            </>
          }
        />

        <main className="flex-1">
          {isDashboardLoading ? <DashboardSkeleton /> : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                  icon={Users}
                  title="Total Active Employees"
                  value={dashboardData?.totalEmployees?.toString() || '0'}
                  colorTheme="blue"
                  showLastMonth={true}
                />
                <StatCard
                  icon={DollarSign}
                  title="Total Salary Paid"
                  value={`Rs ${lastMonthSalary.toLocaleString()}`}
                  colorTheme="green"
                  showLastMonth={true}
                />
                <StatCard
                  icon={Plus}
                  title="Company EPF/ETF Amount"
                  value={`Rs ${((dashboardData?.totalCompanyEPF || 0) + (dashboardData?.totalCompanyETF || 0)).toLocaleString()}`}
                  colorTheme="purple"
                  showLastMonth={false}
                />
                <StatCard
                  icon={PieChart}
                  title="Total Employee EPF"
                  value={`Rs ${dashboardData?.totalEmployeeEPF?.toLocaleString() || '0'}`}
                  colorTheme="orange"
                  showLastMonth={false}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 overflow-hidden">
                {/* Left (2/3) – Salary Paid Summary Chart */}
                <div className="lg:col-span-2 h-full flex flex-col">
                  <SalaryPaidSummary companyId={selectedCompanyId || ''} />
                </div>

                {/* Right (1/3) – Quick Actions */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">
                  <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h2>

                  <div className="flex flex-col gap-4">
                    <QuickAction
                      icon={FileText}
                      title="Generate Payslips"
                      description="Create monthly payslips"
                      bgColor="text-[#4182F9]"
                      lightBgColor="bg-[#EBF2FF]"
                      onClick={() => navigate('/salary')}
                    />

                    <QuickAction
                      icon={UserPlus}
                      title="Add Employee"
                      description="Register new staff member"
                      bgColor="text-[#4182F9]"
                      lightBgColor="bg-[#EBF2FF]"
                      onClick={openAddEmployee}
                    />

                    <QuickAction
                      icon={BarChart3}
                      title="View Reports"
                      description="Access detailed analytics"
                      bgColor="text-[#4182F9]"
                      lightBgColor="bg-[#EBF2FF]"
                      onClick={() => navigate('/reports')}
                    />

                    {/* <QuickAction
                      icon={CreditCard}
                      title="Change Plan"
                      description="Change subscription plan"
                      bgColor="text-[#4182F9]"
                      lightBgColor="bg-[#EBF2FF]"
                      onClick={() => setIsAddonModalOpen(true)}
                    /> */}
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

      {/* Success Modal */}
      {/* <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalTitle}
        message={modalMessage}
      /> */}

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
