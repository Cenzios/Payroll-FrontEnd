import { useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import CreateLoanDrawer from '../components/CreateLoanDrawer';
import LoanHistoryView from '../components/LoanHistoryView';
import SuccessModal from '../components/SuccessModal';
import { useGetLoansQuery } from '../store/apiSlice';
import loanIcon from '../assets/images/loanicon.svg';
import { DollarSign, HandCoins, CircleDotDashed, Shapes } from 'lucide-react';

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
  const { selectedCompanyId } = useAppSelector((state) => state.auth);

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
    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between">
      <div>
        <p className="text-[12px] font-medium text-[#989FA7] mb-1">{title}</p>
        <h3 className="text-[20px] font-bold text-[#1D1F24]">{value}</h3>
      </div>
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
        <Icon className={`${iconColor} w-6 h-6`} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
        {selectedLoan ? (
          <LoanHistoryView loan={selectedLoan} onBack={() => setSelectedLoan(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0">
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
            <div className="flex-1 mt-2 overflow-y-auto">
              <div className="overflow-x-auto h-full">
                {isLoading ? (
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
                    <div className="bg-white rounded-[24px] p-10 max-w-[540px] w-full text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col items-center">
                      <div className="w-32 h-32 mb-8 relative">
                        <div className="absolute inset-0 bg-blue-400/20 blur-[30px] rounded-full scale-110"></div>
                        <img src={loanIcon} alt="No loans" className="w-full h-full relative z-10" />
                      </div>

                      <h3 className="text-[24px] font-bold text-[#1D1F24] mb-4">No loans created yet</h3>

                      <p className="text-[#989FA7] leading-[1.6] text-[15px] mb-10 px-4">
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8 mt-2">
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
                        icon={Shapes}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-500"
                      />
                      <SummaryCard
                        title="Pending Payment"
                        value={`Rs ${totalPendingPayment.toLocaleString()}`}
                        icon={CircleDotDashed}
                        iconBg="bg-rose-50"
                        iconColor="text-rose-500"
                      />
                    </div>

                    <div className="border-x-2 border-y-2 border-[#e1e2e4] rounded-xl overflow-hidden">
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
                                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-transparent flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0">
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
                  </>
                )}
              </div>
            </div>
          </>
        )}
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
