import { useState } from 'react';
import { Plus, Search, Loader2, ScrollText, CreditCard, SlidersHorizontal } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import CreateLoanDrawer from '../components/CreateLoanDrawer';
import LoanHistoryView from '../components/LoanHistoryView';
import SuccessModal from '../components/SuccessModal';
import { useGetLoansQuery } from '../store/apiSlice';
import loanIcon from '../assets/images/loanicon.svg';
import loanAmount from '../assets/images/loan-amount-icon.svg';
import loanPayment from '../assets/images/loan-payment-icon.svg';
import { DollarSign, HandCoins, CircleDotDashed, Shapes } from 'lucide-react';
import AlertBar from '../components/AlertBar';
import logo from '../assets/images/logo-login.svg';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
    case 'ACTIVE':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">Active</span>;
    case 'Pending':
    case 'PENDING':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-500">Pending</span>;
    case 'Completed':
    case 'COMPLETED':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-emerald-500">Completed</span>;
    default:
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500">{status}</span>;
  }
};

const Loans = () => {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const { selectedCompanyId, user } = useAppSelector((state) => state.auth);

  const { data: loans = [], isLoading, isError } = useGetLoansQuery(
    { companyId: selectedCompanyId || "" },
    { skip: !selectedCompanyId }
  );

  // Summary Calculations
  const totalLoanAmount = loans.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
  const totalActiveLoans = loans.filter((l: any) => {
    const status = (l.status || 'Active').toUpperCase();
    return status === 'ACTIVE' || status === 'PENDING';
  }).length;
  const totalAmountCollected = loans.reduce((sum: number, l: any) =>
    sum + (l.installments?.reduce((insSum: number, ins: any) => insSum + (ins.paidAmount || 0), 0) || 0), 0
  );
  const totalPendingPayment = totalLoanAmount - totalAmountCollected;

  const SummaryCard = ({ title, value, icon: Icon, iconBg, iconColor }: {
    title: string;
    value: string | number;
    icon: any;
    iconBg: string;
    iconColor: string;
  }) => (
    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between
      max-sm:p-4 max-sm:rounded-2xl max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:shadow-[0_2px_12px_rgba(0,0,0,0.06)] max-sm:border-[#F0F0F0]">
      <div>
        <p className="text-[12px] font-medium text-[#989FA7] mb-1 max-sm:text-[11px]">{title}</p>
        <h3 className="text-[20px] font-bold text-[#1D1F24] max-sm:text-[17px]">{value}</h3>
      </div>
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center
        max-sm:w-7 max-sm:h-7 max-sm:rounded-lg max-sm:order-first`}>
        <Icon className={`${iconColor} w-6 h-6 max-sm:w-3.5 max-sm:h-3.5`} />
      </div>
    </div>
  );


  // Mobile-only loan card matching the design
  const MobileLoanCard = ({ loan }: { loan: any }) => (
    <div
      className="bg-white rounded-2xl border border-[#EBEBEB] p-4 cursor-pointer active:bg-gray-50 transition-colors shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
      onClick={() => setSelectedLoan(loan)}
    >
      {/* Employee row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[15px] shrink-0 overflow-hidden">
            {loan.employee?.fullName?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#353843]">{loan.employee?.fullName}</div>
            <div className="text-[11px] text-[#A8B0B9] mt-0.5">{loan.employee?.employeeId}</div>
          </div>
        </div>
        {getStatusBadge(loan.status || 'Active')}
      </div>

      {/* Loan Amount + Loan Title row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] text-[#989FA7] mb-0.5 font-medium">Loan Amount</p>
          <p className="text-[16px] font-bold text-[#1D1F24]">
            Rs: {loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <p className="text-[12px] font-semibold text-[#6B7280]">{loan.loanTitle}</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#F2F2F2] mb-3" />

      {/* Stats row: Interest | Installments | Premium */}
      <div className="grid grid-cols-3 gap-0">
        <div className="text-center">
          <p className="text-[9px] text-[#989FA7] uppercase tracking-wide font-semibold mb-1">Interest</p>
          <p className="text-[11px] font-bold text-[#353843]">
            {loan.interestRate}% ({loan.interestRateType === 'ANNUALLY' ? 'Annually' : 'Monthly'})
          </p>
        </div>
        <div className="text-center border-x border-[#F0F0F0]">
          <p className="text-[9px] text-[#989FA7] uppercase tracking-wide font-semibold mb-1">Installments</p>
          <p className="text-[11px] font-bold text-[#353843]">
            {loan.installments?.filter((i: any) => i.status === 'PAID').length || 0} / {loan.installmentCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-[#989FA7] uppercase tracking-wide font-semibold mb-1">Premium</p>
          <p className="text-[11px] font-bold text-[#353843]">
            Rs:{loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">

      <AlertBar />

      {/* Margin bottom gap after the banner */}
      <div className="-mb-4 shrink-0"></div>

      <div className="flex flex-1 overflow-hidden relative w-full translate-x-0 md:translate-x-0">

        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 md:p-6 h-screen overflow-hidden flex flex-col max-sm:overflow-y-auto max-sm:h-svh">

          {selectedLoan ? (
            <LoanHistoryView loan={selectedLoan} onBack={() => setSelectedLoan(null)} />
          ) : (
            <>
              {/* MOBILE HEADER */}
              <div className="hidden mt-6 max-sm:flex items-center justify-between pt-5 pb-3 border-b border-gray-100">
                <div>
                  <img src={logo} alt="logo" className='w-40 h-10' />
                </div>
                <div className="flex items-center gap-2 ml-6">

                  {/* Avatar circle */}
                  <div className="w-9 h-9 rounded-full mr-5 bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                </div>
              </div>

              {/* Mobile Title & Action */}
              <div className="hidden max-sm:block px-6 py-4 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className='px-3'>
                    <div className="inline-block rounded-sm">
                      <h1 className="text-[22px] font-bold text-[#1D1F24]">Loans</h1>
                    </div>
                    <p className="text-[13px] text-[#989FA7] font-medium">Handle Employees Loans</p>
                  </div>
                  <button
                    onClick={() => setIsCreateDrawerOpen(true)}
                    className="flex items-center gap-2 bg-[#2054C8] text-white pl-5 pr-2 py-2 rounded-lg text-[14px] font-bold shadow-lg shadow-blue-100
                    max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] "
                  >
                    Create Loan
                    <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Desktop Header */}
              <div className="shrink-0 max-sm:hidden">
                <PageHeader
                  title="Loans"
                  subtitle="Handle Employees Loans"
                  actionElement={
                    <button
                      onClick={() => setIsCreateDrawerOpen(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                    >
                      Create Loan
                      <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center ml-1">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  }
                />
              </div>

              {/* Main Content */}
              <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden max-sm:overflow-visible max-sm:px-6">
                <div className="overflow-x-auto h-full max-sm:h-auto max-sm:overflow-visible">{isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500">Loading loans...</p>
                  </div>
                ) : isError ? (
                  <div className="text-center py-20 text-red-500">
                    Failed to load loans. Please try again.
                  </div>
                ) : loans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
                    <div className="bg-white rounded-[24px] p-10 max-w-[540px] w-full text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col items-center
                        max-sm:rounded-2xl max-sm:p-6 max-sm:shadow-none max-sm:border-0">
                      <div className="w-32 h-32 mb-8 relative max-sm:w-24 max-sm:h-24 max-sm:mb-6">
                        <div className="absolute inset-0 bg-blue-400/20 blur-[30px] rounded-full scale-110"></div>
                        <img src={loanIcon} alt="No loans" className="w-full h-full relative z-10" />
                      </div>

                      <h3 className="text-[24px] font-bold text-[#1D1F24] mb-4 max-sm:text-[20px]">No loans created yet</h3>

                      <p className="text-[#989FA7] leading-[1.6] text-[15px] mb-10 px-4 max-sm:text-[13px] max-sm:mb-7 max-sm:px-0">
                        Start managing employee loans by creating your first loan record. Track amounts, interest rates, instalments and repayment status all in one place.
                      </p>

                      <button
                        onClick={() => setIsCreateDrawerOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-6 pr-2 py-2.5 rounded-full text-[15px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
                      >
                        Create Loan
                        <div className="bg-white text-blue-600 rounded-full w-7 h-7 flex items-center justify-center ml-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary Cards — 4-col on desktop, 2×2 grid on mobile */}
                    <div className="grid grid-cols-4 gap-6 mb-8 mt-2
                        max-sm:grid-cols-2 max-sm:gap-3 max-sm:mb-5 max-sm:mt-1">
                      <SummaryCard
                        title="Total Active Loans"
                        value={totalActiveLoans}
                        icon={HandCoins}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-500"
                      />
                      <SummaryCard
                        title="Total Loan Amount"
                        value={`Rs ${totalLoanAmount.toLocaleString()}`}
                        icon={DollarSign}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-500"
                      />
                      <SummaryCard
                        title="Total Amount Collected"
                        value={`Rs ${totalAmountCollected.toLocaleString()}`}
                        icon={ScrollText}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-500"
                      />
                      <SummaryCard
                        title="Pending Payment"
                        value={`Rs ${totalPendingPayment.toLocaleString()}`}
                        icon={CreditCard}
                        iconBg="bg-rose-50"
                        iconColor="text-rose-500"
                      />
                    </div>

                    {/* "Employee Loans" section header — mobile only */}
                    <div className="hidden max-sm:flex items-center justify-between mb-3">
                      <p className="text-[15px] font-bold text-[#1D1F24]">Employee Loans</p>
                      {/* <button className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280] border border-[#E5E7EB] bg-white rounded-full px-3 py-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Filter
                        </button> */}
                    </div>

                    {/* Desktop: table */}
                    <div className="border-x-2 border-y-2 border-[#e1e2e4] rounded-xl overflow-hidden max-sm:hidden">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead className="bg-[#FAFBFC]">
                          <tr className="border-b-2 border-[#e1e2e4]">
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Employee</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Loan Title</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Amount</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Interest Rate</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Installments</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Monthly Premium</th>
                            <th className="py-4 px-6 text-sm font-medium text-[#97A0AB]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e3e4e7] ">
                          {loans.map((loan: any) => (
                            <tr
                              key={loan.id}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedLoan(loan)}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-200 border border-transparent flex items-center justify-center text-blue-700 font-bold overflow-hidden shrink-0">
                                    {loan.employee?.fullName?.charAt(0) || 'E'}
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-bold text-[#353843]">{loan.employee?.fullName}</div>
                                    <div className="text-[12px] text-[#A8B0B9] mt-0.5">{loan.employee?.employeeId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.loanTitle}</td>
                              <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">Rs: {loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.interestRate}% ({loan.interestRateType === 'ANNUALLY' ? 'Annually' : 'Monthly'})</td>
                              <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.installments?.filter((i: any) => i.status === 'PAID').length || 0} / {loan.installmentCount}</td>
                              <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">Rs:{loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="py-4 px-6">
                                {getStatusBadge(loan.status || 'Active')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: card list */}
                    <div className="hidden max-sm:flex flex-col gap-3 pb-20">
                      {loans.map((loan: any) => (
                        <MobileLoanCard key={loan.id} loan={loan} />
                      ))}
                    </div>
                  </>
                )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CreateLoanDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSuccess={() => setShowSuccessModal(true)}
        companyId={selectedCompanyId}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Changes Saved"
        message="Loan Details Successfully Added."
      />
    </div>


  );
};

export default Loans;
