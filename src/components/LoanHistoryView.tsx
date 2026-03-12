import { ExternalLink, Calendar, CheckCircle2, Clock, CalendarDays, ArrowLeft, Loader2 } from 'lucide-react';
import PageHeader from './PageHeader';
import { useGetLoanByIdQuery } from '../store/apiSlice';
import { useAppSelector } from '../store/hooks';

interface LoanHistoryViewProps {
    loan: any;
    onBack: () => void;
}

const getHistoryBadge = (status: string) => {
    switch (status) {
        case 'Paid':
        case 'PAID':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-500">Paid</span>;
        case 'Pending':
        case 'PENDING':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-500">Pending</span>;
        case 'Upcoming':
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">Upcoming</span>;
        default:
            return <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-400">{status}</span>;
    }
};

const LoanHistoryView = ({ loan: initialLoan, onBack }: LoanHistoryViewProps) => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const { data: loan, isLoading, isError } = useGetLoanByIdQuery(
        { loanId: initialLoan.id, companyId: selectedCompanyId || "" },
        { skip: !selectedCompanyId || !initialLoan.id }
    );

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading loan history...</p>
            </div>
        );
    }

    if (isError || !loan) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-500">
                <p>Failed to load loan details.</p>
                <button onClick={onBack} className="mt-4 text-blue-500 underline text-sm">Back to Loans</button>
            </div>
        );
    }

    const installments = loan.installments || [];
    const paidInstallmentsCount = installments.filter((i: any) => i.status === 'PAID').length;
    const totalInstallmentsCount = loan.installmentCount || installments.length || 1;
    const progressPercent = Math.min(Math.round((paidInstallmentsCount / totalInstallmentsCount) * 100), 100);

    // Interest calculation based on rate and type
    const interestRateVal = loan.interestRate || 0;
    const totalInterest = loan.interestRateType === 'ANNUALLY'
        ? loan.amount * (interestRateVal / 100) * (totalInstallmentsCount / 12)
        : loan.amount * (interestRateVal / 100) * totalInstallmentsCount;

    const fullAmountWithInterest = loan.amount + totalInterest;
    const currentPaidAmount = installments
        .filter((i: any) => i.status === 'PAID')
        .reduce((sum: number, i: any) => sum + i.amount, 0);

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
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(loan.employee?.fullName || 'E')}&background=BFDBFE&color=2563EB`}
                            alt={loan.employee?.fullName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#141B3B] mb-2">{loan.employee?.fullName}</h2>
                        <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded text-gray-600 text-[10px]">ID</span>
                                {loan.employee?.employeeId}
                            </div>
                            <div className="w-px h-3 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {loan.loanTitle}
                            </div>
                            <div className="w-px h-3 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold">%</span>
                                {loan.interestRate}% ({loan.interestRateType === 'ANNUALLY' ? 'Annually' : 'Monthly'})
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
                        <div className="text-[12px] text-gray-400 font-medium">Includes Rs: {totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })} interest</div>
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
                                {paidInstallmentsCount} / {totalInstallmentsCount} Installments
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
                        <div className="text-[12px] text-gray-400 font-medium">Next due: {installments.find((i: any) => i.status === 'PENDING')?.dueDate ? new Date(installments.find((i: any) => i.status === 'PENDING').dueDate).toLocaleDateString() : '-'}</div>
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
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Total Premium</th>
                                <th className="pb-4 px-2 text-xs font-semibold text-[#989FA7]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {installments.map((row: any) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2 text-[13px] font-semibold text-gray-400">{row.installmentNumber} / {totalInstallmentsCount}</td>
                                    <td className={`py-4 px-2 text-[13px] font-bold ${row.status === 'PENDING' ? 'text-[#141B3B]' : 'text-gray-500'}`}>{new Date(row.dueDate).toLocaleDateString()}</td>
                                    <td className="py-4 px-2 text-[13px] font-semibold text-gray-500">{row.status === 'PAID' ? new Date(row.updatedAt).toLocaleDateString() : '-'}</td>
                                    <td className="py-4 px-2 text-[13px] font-bold text-gray-500">Rs: {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
