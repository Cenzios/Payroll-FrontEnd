import { useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import CreateLoanDrawer from '../components/CreateLoanDrawer';
import LoanHistoryView from '../components/LoanHistoryView';
import { useGetLoansQuery } from '../store/apiSlice';

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
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const { selectedCompanyId } = useAppSelector((state) => state.auth);

  const { data: loans = [], isLoading, isError } = useGetLoansQuery(
    { companyId: selectedCompanyId || "" },
    { skip: !selectedCompanyId }
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">
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

            {/* Main Content - Table */}
            <div className="flex-1 mt-2 overflow-y-auto">
              <div className="overflow-x-auto">
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
                  <div className="text-center py-20 text-gray-400">
                    No loans found for this company.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Employee</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Loan Title</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Amount</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Interest Rate</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Installments</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Monthly Premium</th>
                        <th className="py-4 px-6 text-sm font-medium text-[#989FA7]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loans.map(loan => (
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
                          <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.installmentCount} months</td>
                          <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">Rs:{loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4 px-6">
                            {getStatusBadge(loan.status || 'Active')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <CreateLoanDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        companyId={selectedCompanyId}
      />
    </div>
  );
};

export default Loans;
