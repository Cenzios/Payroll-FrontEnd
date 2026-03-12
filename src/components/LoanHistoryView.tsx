import { ExternalLink, Calendar, CheckCircle2, Clock, CalendarDays, ArrowLeft } from 'lucide-react';
import PageHeader from './PageHeader';

interface Loan {
    id: string;
    employee: {
        name: string;
        id: string;
        avatar: string;
    };
    title: string;
    amount: number;
    interestRate: string;
    installments: string; // e.g., "14 / 24"
    monthlyPremium: number;
    status: string;
}

interface LoanHistoryViewProps {
    loan: Loan;
    onBack: () => void;
}

// Dummy data for history
const PAYMENT_HISTORY = [
    { id: 1, installment: '16 / 24', dueDate: 'Nov 15, 2024', paymentDate: '-', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Upcoming' },
    { id: 2, installment: '15 / 24', dueDate: 'Oct 15, 2024', paymentDate: '-', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Pending' },
    { id: 3, installment: '14 / 24', dueDate: 'Sep 15, 2024', paymentDate: 'Sep 12, 2024', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Paid' },
    { id: 4, installment: '13 / 24', dueDate: 'Aug 15, 2024', paymentDate: 'Aug 14, 2024', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Paid' },
    { id: 5, installment: '12 / 24', dueDate: 'Jul 15, 2024', paymentDate: 'Jul 15, 2024', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Paid' },
    { id: 6, installment: '11 / 24', dueDate: 'Jun 15, 2024', paymentDate: 'Jun 13, 2024', principal: 5000.00, interest: 275.00, total: 5275.00, status: 'Paid' },
];

const getHistoryBadge = (status: string) => {
    switch (status) {
        case 'Paid':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-500">Paid</span>;
        case 'Pending':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-500 text-white shadow-sm">Pending</span>;
        case 'Upcoming':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">Upcoming</span>;
        default:
            return null;
    }
};

const LoanHistoryView = ({ loan, onBack }: LoanHistoryViewProps) => {

    // Calculate dummy stats based on loan amount (for UI demonstration purposes)
    const paidInstallments = parseInt(loan.installments.split(' / ')[0]) || 0;
    const totalInstallments = parseInt(loan.installments.split(' / ')[1]) || 1;
    const progressPercent = Math.min(Math.round((paidInstallments / totalInstallments) * 100), 100);

    const fullAmountWithInterest = loan.amount + (loan.amount * 0.055); // Dummy 5.5% calc
    const currentPaidAmount = (fullAmountWithInterest / totalInstallments) * paidInstallments;

    return (
        <div className="flex-1 flex flex-col pt-0">
            {/* Standard Header */}
            <div className="mb-6 -mt-2">
                <PageHeader 
                    title="Loans"
                    subtitle="Loan history"
                    actionElement={
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-2 text-[#4F5660] hover:text-blue-600 font-semibold text-sm transition-colors py-2 px-4 rounded-full border border-gray-200 hover:border-blue-200 bg-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Loans
                        </button>
                    }
                />
            </div>

            {/* Top Employee Card */}
            <div className="bg-[#407BFF1A] rounded-2xl p-6 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {/* Dummy image or Avatar letter */}
                        <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(loan.employee.name)}&background=BFDBFE&color=2563EB`} 
                            alt={loan.employee.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#141B3B] mb-2">{loan.employee.name}</h2>
                        <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded text-gray-600 text-[10px]">ID</span>
                                {loan.employee.id}
                            </div>
                            <div className="w-px h-3 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {loan.title}
                            </div>
                            <div className="w-px h-3 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold">%</span>
                                {loan.interestRate}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <span className="text-blue-600 text-sm font-semibold">{loan.status}</span>
                </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <ExternalLink className="w-4 h-4 -rotate-45" />
                        Principal Loan Amount
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Requested Amount</div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <Clock className="w-4 h-4" />
                        Full Amount (w/ Interest)
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {fullAmountWithInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Includes Rs: {(fullAmountWithInterest - loan.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} interest</div>
                    </div>
                </div>

                {/* Card 3 (With Progress Bar) */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        Current Paid Amount
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-[#141B3B] mb-2">
                            Rs: {currentPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
                                {loan.installments} Installments
                            </div>
                            <div className="flex-1 max-w-[100px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <div className="text-[12px] font-bold text-[#141B3B]">{progressPercent}%</div>
                        </div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <CalendarDays className="w-4 h-4" />
                        Monthly Premium
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Next due: Oct 15, 2024</div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div>
                <h3 className="text-lg font-bold text-[#141B3B] mb-6">Monthly Payment History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Installment</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Due Date</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Payment Date</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Principal Component</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Interest Component</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Total Premium</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {PAYMENT_HISTORY.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2 text-[13px] font-semibold text-gray-400">{row.installment}</td>
                                    <td className={`py-4 px-2 text-[13px] font-bold ${row.status === 'Pending' ? 'text-[#141B3B]' : 'text-gray-500'}`}>{row.dueDate}</td>
                                    <td className="py-4 px-2 text-[13px] font-semibold text-gray-500">{row.paymentDate}</td>
                                    <td className="py-4 px-2 text-[13px] font-bold text-gray-500">Rs: {row.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 px-2 text-[13px] font-bold text-gray-500">Rs: {row.interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 px-2 text-[13px] font-bold text-gray-500">Rs: {row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 px-2">
                                        {getHistoryBadge(row.status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default LoanHistoryView;
