import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import CreateLoanDrawer from '../components/CreateLoanDrawer';
import LoanHistoryView from '../components/LoanHistoryView';

export interface LoanType {
  id: string;
  employee: {
    name: string;
    id: string;
    avatar: string;
  };
  title: string;
  amount: number;
  interestRate: string;
  installments: string;
  monthlyPremium: number;
  status: string;
}

const DUMMY_LOANS: LoanType[] = [
  {
    id: '1',
    employee: { name: 'Marcus Johnson', id: 'EMP-0412', avatar: 'M' },
    title: 'Personal Loan',
    amount: 120000.00,
    interestRate: '5.5% (Annually)',
    installments: '14 / 24',
    monthlyPremium: 529.16,
    status: 'Active'
  },
  {
    id: '2',
    employee: { name: 'Sarah Chen', id: 'EMP-0891', avatar: 'S' },
    title: 'Housing Advance',
    amount: 50000.00,
    interestRate: '4.0% (Annually)',
    installments: '5 / 48',
    monthlyPremium: 229.16,
    status: 'Active'
  },
  {
    id: '3',
    employee: { name: 'David Okafor', id: 'EMP-0322', avatar: 'D' },
    title: 'Car Loan',
    amount: 90000.00,
    interestRate: '1.2% (Monthly)',
    installments: '0 / 12',
    monthlyPremium: 400.16,
    status: 'Pending'
  },
  {
    id: '4',
    employee: { name: 'Elena Rodriguez', id: 'EMP-1104', avatar: 'E' },
    title: 'Emergency Loan',
    amount: 20000.00,
    interestRate: '0.0% (Annually)',
    installments: '2 / 6',
    monthlyPremium: 122.16,
    status: 'Active'
  },
  {
    id: '5',
    employee: { name: 'John De', id: 'EMP-1108', avatar: 'J' },
    title: 'Personal Loan',
    amount: 20000.00,
    interestRate: '5.5% (Annually)',
    installments: '6 / 6',
    monthlyPremium: 390.16,
    status: 'Completed'
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">Active</span>;
    case 'Pending':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-500">Pending</span>;
    case 'Completed':
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-emerald-500">Completed</span>;
    default:
      return null;
  }
};

const Loans = () => {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanType | null>(null);
  const { selectedCompanyId } = useAppSelector((state) => state.auth);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 min-h-screen flex flex-col">
        {selectedLoan ? (
          <LoanHistoryView loan={selectedLoan} onBack={() => setSelectedLoan(null)} />
        ) : (
          <>
            {/* Header */}
            <PageHeader 
              title="Loans" 
              subtitle="Handle Employees Loans" 
              actionElement={
                <button 
                  onClick={() => setIsCreateDrawerOpen(true)}
                  className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                >
                  Create Loan
                  <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center ml-1">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              }
            />

            {/* Main Content - Table */}
            <div className="flex-1 mt-2">
              <div className="overflow-x-auto">
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
                {DUMMY_LOANS.map(loan => (
                  <tr 
                    key={loan.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 border border-transparent flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0">
                          {loan.employee.avatar}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-[#353843]">{loan.employee.name}</div>
                          <div className="text-[12px] text-[#A8B0B9] mt-0.5">{loan.employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.title}</td>
                    <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">Rs: {loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.interestRate}</td>
                    <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">{loan.installments}</td>
                    <td className="py-4 px-6 text-[#4F5660] font-medium text-[14px]">Rs:{loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(loan.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
