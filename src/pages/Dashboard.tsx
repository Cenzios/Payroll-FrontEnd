import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, setAuthFromToken, setSelectedCompanyId } from '../store/slices/authSlice';
import axiosInstance from '../api/axios';
import {
  Users,
  DollarSign,
  FileText,
  UserPlus,
  BarChart3,
  Plus,
  PieChart,
  ChevronDown,
  Building2,
  AlertTriangle
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
import AlertBar from '../components/AlertBar';
import logo from '../assets/images/logo-login.svg';

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
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [remainingDays, setRemainingDays] = useState(7);
  const [isTrial, setIsTrial] = useState(false);

  const urlToken = searchParams.get('token');
  const isTokenPending = !!urlToken && urlToken !== token;

  // RTK Query hooks
  const [createCompanyMutation] = useCreateCompanyMutation(); // ✅ Hook for mutation
  const { data: companies = [], refetch: refetchCompanies } = useGetCompaniesQuery(undefined, {
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

  // ✅ 1. Automatic Company Creation for Trial Users
  useEffect(() => {
    const createPendingCompany = async () => {
      const tempName = localStorage.getItem('temp_companyName');
      if (tempName && token && user) {
        try {
          console.log('🏢 Transitioning Trial User: Creating company detected in localStorage...');
          const companyData = {
            name: tempName,
            email: localStorage.getItem('temp_companyEmail') || user.email,
            address: localStorage.getItem('temp_companyAddress') || 'Not Provided',
            contactNumber: localStorage.getItem('temp_companyPhone') || '',
            departments: [], // ✅ Use empty array
          };

          await createCompanyMutation(companyData).unwrap();
          console.log('✅ Trial company created successfully via Mutation');

          // Refresh companies list manually to be absolutely sure
          refetchCompanies();

          // Clear storage
          localStorage.removeItem('temp_companyName');
          localStorage.removeItem('temp_companyEmail');
          localStorage.removeItem('temp_companyAddress');
          localStorage.removeItem('temp_companyPhone');
        } catch (err) {
          console.error('❌ Failed to create trial company:', err);
        }
      }
    };
    if (token && user) createPendingCompany();
  }, [token, user, createCompanyMutation, refetchCompanies]);

  // ✅ 2. Robust Trial Status & Banner Logic
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const { data } = await axiosInstance.get('/subscription/current');
        if (data?.data) {
          setActiveSubscription(data.data);
          const isTrialUser = data.data.isTrialUser;

          if (isTrialUser) {
            setIsTrial(true);
            const createdDate = new Date(data.data.createdAt);
            const now = new Date();
            const diffTime = now.getTime() - createdDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const remDays = 7 - diffDays;
            setRemainingDays(remDays > 0 ? remDays : 0);

            if (remDays <= 0) {
              navigate('/buy-plan?isUpgrade=true');
            }
          } else {
            setIsTrial(false);
          }
        } else {
          handleTrialFallback();
        }
      } catch (err) {
        console.warn('Subscription fetch failed, falling back to User-based trial logic');
        handleTrialFallback();
      }
    };

    const handleTrialFallback = () => {
      // Fallback to User model's isTrialUser and createdAt
      if (user?.isTrialUser) {
        setIsTrial(true);
        // Use user.createdAt if available (from DB), otherwise assume just started
        const signupDate = (user as any).createdAt ? new Date((user as any).createdAt) : new Date();
        const now = new Date();
        const diffTime = now.getTime() - signupDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remDays = 7 - diffDays;
        setRemainingDays(remDays > 0 ? remDays : 0);

        if (remDays <= 0) {
          navigate('/buy-plan?isUpgrade=true');
        }
      } else {
        setIsTrial(false);
      }
    };

    if (token) checkTrialStatus();
  }, [token, navigate, user]);

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
        // await createCompany(data as CreateCompanyRequest).unwrap();
        await createCompanyMutation(data as CreateCompanyRequest).unwrap();
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans
    max-sm:h-auto max-sm:overflow-auto">
      {/* {isTrial && (
        <div className='flex shrink-0 items-center justify-center relative py-1 bg-[#438FEF] text-[11px] text-white h-7 w-full z-50 gap-2 tracking-wider'>
          <AlertTriangle className="w-5 h-5" />
          <p className="text-white">Heads Up! Your trial ends in
            <span className="font-bold p-[2px] rounded-[4px] bg-orange-400 mx-2"> {remainingDays > 0 ? remainingDays : 0} </span>
            Days</p>
          <span className='text-gray-600 text-2xl'> | </span>
          <p>
            <button
              onClick={() => navigate('/get-plan?isUpgrade=true')}
              className='font-extrabold underline cursor-pointer'>
              Upgrade Now</button> to keep your account active!</p>
        </div>
      )} */}

      <AlertBar />

      {/* Margin bottom gap after the banner */}
      <div className="-mb-4 shrink-0"></div>

      <div className="flex flex-1 overflow-hidden relative w-full translate-x-0
      max-sm:flex-col max-sm:overflow-visible">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-6 h-full overflow-hidden flex flex-col
        max-sm:ml-0 max-sm:p-5 max-sm:py-7 max-sm:overflow-visible max-sm:h-auto">

          {/* ── MOBILE HEADER (replaces PageHeader on mobile) ── */}
          <div className="hidden  max-sm:flex items-center justify-between -ml-3 pt-5 pb-3 border-b border-gray-100">
            <div>
              <img src={logo} alt="logo" />
            </div>
            <div className="flex items-center gap-2 ml-6">
              {/* Company switcher pill */}
              <button
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700"
              >
                <Building2 className="w-3 h-3 text-gray-500" />
                {selectedCompany?.name
                  ? selectedCompany.name.split(' ').slice(0, 2).join(' ') + ' ...'
                  : 'Select Co'}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <CompanySwitcher
                isOpen={isCompanyDropdownOpen}
                onClose={() => setIsCompanyDropdownOpen(false)}
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={(id) => dispatch(setSelectedCompanyId(id))}
                onAddNew={() => { setIsCompanyDropdownOpen(false); openAddCompany(); }}
              />
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>

          <div className="max-sm:hidden">
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
          </div>

          <main className="flex-1 max-sm:mt-2">
            {isDashboardLoading ? <DashboardSkeleton /> : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6
                ">
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

                {/* add buttons */}
                <div className='hidden max-sm:flex items-center justify-center gap-6 mt-10 mb-4'>
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
                    className="w-[160px] flex items-center gap-2 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] text-white pl-5 pr-2 py-2 rounded-lg text-sm font-normal transition-colors"
                    title={!selectedCompanyId ? "Please select a company from the Dashboard first" : ""}
                  >
                    <span className="whitespace-nowrap">Add Employee</span>
                    <div className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>

                  {/* add company button */}
                  <button
                    onClick={openAddCompany}
                    className="w-[160px] flex items-center gap-2 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] text-white pl-5 pr-2 py-2 rounded-lg text-sm font-normal transition-colors"
                    title="Add New Company"
                  >
                    <span className="whitespace-nowrap">Add Company</span>
                    <div className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 ml-1">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 overflow-hidden">
                  {/* Left (2/3) – Salary Paid Summary Chart */}
                  <div className="lg:col-span-2 h-full flex flex-col">
                    <SalaryPaidSummary companyId={selectedCompanyId || ''} />
                  </div>

                  {/* Right (1/3) – Quick Actions */}
                  <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full
                                  max-sm:p-4">
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

                      <div className='max-sm:hidden'>
                        <QuickAction
                          icon={UserPlus}
                          title="Add Employee"
                          description="Register new staff member"
                          bgColor="text-[#4182F9]"
                          lightBgColor="bg-[#EBF2FF]"
                          onClick={openAddEmployee}
                        />
                      </div>

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
