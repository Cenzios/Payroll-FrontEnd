import { ExternalLink, Calendar, CheckCircle2, CalendarDays, ArrowLeft, Loader2, Coins, PieChart, Eye, FileText, Plus } from 'lucide-react';
import PageHeader from './PageHeader';
import { useGetLoanByIdQuery, useUploadEmployeeDocumentMutation } from '../store/apiSlice';
import { useAppSelector } from '../store/hooks';
import { useRef, useState } from 'react';
import FileUploadModal from './FileUploadModal';
import DocumentViewerModal from './DocumentViewerModal';
import logo from '../assets/images/logo-login.svg';


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

const getLoanStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'ACTIVE':
            return <span className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-blue-50 text-blue-600">Active</span>;
        case 'PENDING':
            return <span className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-orange-50 text-orange-500">Pending</span>;
        case 'COMPLETED':
            return <span className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-green-50 text-emerald-500">Completed</span>;
        default:
            return <span className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-gray-50 text-gray-500">{status || 'Active'}</span>;
    }
};

const LoanHistoryView = ({ loan: initialLoan, onBack }: LoanHistoryViewProps) => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const { data: loan, isLoading, isError } = useGetLoanByIdQuery(
        { loanId: initialLoan.id, companyId: selectedCompanyId || "" },
        { skip: !selectedCompanyId || !initialLoan.id }
    );

    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [uploadDocument, { isLoading: isUploading }] = useUploadEmployeeDocumentMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleUploadClick = () => {
        setIsModalOpen(true);
    };

    const handleUploadSubmit = async () => {
        if (selectedFiles.length === 0 || !selectedCompanyId || !loan) return;

        const formData = new FormData();
        // Upload the first file (backend currently handles single file per call based on upload.single('file'))
        formData.append('file', selectedFiles[0]);
        formData.append('employeeId', loan.employeeId);
        formData.append('loanId', loan.id);
        formData.append('documentType', 'LOAN');

        try {
            await uploadDocument(formData).unwrap();
            setIsModalOpen(false);
            setSelectedFiles([]);
            alert('Document uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload document');
        }
    };

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
        <div className="flex-1 flex flex-col pt-6">
            {/* Standard Header */}
            <div className="mb-6 -mt-2 max-sm:hidden">
                <PageHeader
                    title="Loans"
                    subtitle="Loan history"
                    actionElement={
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-[#4F5660] hover:text-blue-600 font-semibold text-xs sm:text-sm transition-colors py-1.5 px-3 sm:py-2 sm:px-4 rounded-full border border-gray-200 hover:border-blue-200 bg-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Loans
                        </button>
                    }
                />
            </div>

            {/* MOBILE HEADER */}
            <div className="hidden mt-6 max-sm:flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                    <img src={logo} alt="logo" className='w-40 h-10' />
                </div>
                <div className="flex items-center gap-2 ml-6">

                    {/* Avatar circle */}
                    <div className="w-9 h-9 rounded-full mr-5 bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {loan.employee?.fullName?.charAt(0) || 'E'}
                    </div>
                </div>
            </div>

            {/* Mobile Title & Action */}
            <div className="hidden max-sm:block px-6 py-4 bg-white shrink-0">
                <div className="flex items-center justify-between mb-1">
                    <div className='px-1'>
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

            {/* Top Employee Card */}
            <div className="bg-[#407BFF1A] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4
    max-sm:mx-5 max-sm:mt-3 max-sm:rounded-3xl max-sm:bg-white max-sm:shadow-md max-sm:border max-sm:border-gray-100">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-[13px] font-medium text-gray-500">
                    <div className="w-[60px] h-[60px] rounded-full bg-blue-200 text-blue-700 font-bold text-3xl flex items-center justify-center shrink-0 overflow-hidden">
                        {/* <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(loan.employee?.fullName || 'E')}&background=BFDBFE&color=2563EB`}
                            alt={loan.employee?.fullName}
                            className="w-full h-full object-cove"
                        /> */}
                        {loan.employee?.fullName?.charAt(0) || 'E'}

                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-[#141B3B] mb-2">{loan.employee?.fullName}</h2>
                        <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 flex items-center justify-center bg-gray-200 rounded text-gray-600 text-[10px]">ID</span>
                                {loan.employee?.employeeId}
                            </div>
                            <div className="w-px h-3 bg-gray-300"></div>
                            <div className='flex items-center gap-4'>
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
                </div>
                <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
                    <button
                        onClick={() => setIsViewModalOpen(true)}
                        disabled={!loan?.supportingDoc}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shadow-blue-500/10 max-sm:w-full max-sm:justify-center max-sm:py-3 max-sm:rounded-2xl max-sm:bg-[#4A7DFF] max-sm:text-white
                            ${!loan?.supportingDoc
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold'}`}
                    >
                        <Eye className={`w-4 h-4 ${!loan?.supportingDoc ? 'text-gray-300' : 'text-white'}`} />
                        {loan?.supportingDoc ? 'View Document' : 'No Document'}
                    </button>
                    {getLoanStatusBadge(loan.status)}

                    <DocumentViewerModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        doc={loan?.supportingDoc || null}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8
    max-sm:mx-5 max-sm:grid-cols-1 max-sm:gap-3">
                {/* Card 1 */}
                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] sm:h-[130px]
    max-sm:min-h-0 max-sm:p-5 max-sm:rounded-2xl">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <ExternalLink className="w-4 h-4 -rotate-45" />
                        Principal Loan Amount
                    </div>
                    <div>
                        <div className="text-[16px] sm:text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Requested Amount</div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] sm:h-[130px]
    max-sm:min-h-0 max-sm:p-5 max-sm:rounded-2xl">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <PieChart className="w-4 h-4" />
                        Full Amount (w/ Interest)
                    </div>
                    <div>
                        <div className="text-[16px] sm:text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {fullAmountWithInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Includes Rs: {totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })} interest</div>
                    </div>
                </div>

                {/* Card 3 (With Progress Bar) */}
                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] sm:h-[130px]
    max-sm:min-h-0 max-sm:p-5 max-sm:rounded-2xl">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        Current Paid Amount
                    </div>
                    <div>
                        <div className="text-[16px] sm:text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {currentPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-3 max-sm:mt-1">
                            <div className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
                                {paidInstallmentsCount} / {totalInstallmentsCount} Installments
                            </div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-sm:max-w-none">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="text-[12px] font-bold text-[#141B3B]">{progressPercent}%</div>
                        </div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] sm:h-[130px]
    max-sm:min-h-0 max-sm:p-5 max-sm:rounded-2xl">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400">
                        <CalendarDays className="w-4 h-4" />
                        Monthly Premium
                    </div>
                    <div>
                        <div className="text-[16px] sm:text-[22px] font-bold text-[#141B3B] mb-1">
                            Rs: {loan.monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[12px] text-gray-400 font-medium">Next due: {installments.find((i: any) => i.status === 'PENDING')?.dueDate ? new Date(installments.find((i: any) => i.status === 'PENDING').dueDate).toLocaleDateString() : '-'}</div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className='max-sm:mx-5 max-sm:pb-20'>
                <h3 className="text-lg font-bold text-[#141B3B] mb-6">Monthly Payment History</h3>
                {/* Mobile Card View */}
                <div className="flex flex-col gap-3 sm:hidden">
                    {installments.map((row: any) => (
                        <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            {/* Top row: installment number + status badge */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[13px] font-bold text-[#141B3B]">
                                    {row.installmentNumber} / {totalInstallmentsCount}
                                    <span className="text-gray-400 font-medium ml-1.5">
                                        Due {new Date(row.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </span>
                                {getHistoryBadge(row.status)}
                            </div>

                            {/* 2x2 grid of fields */}
                            <div className="grid grid-cols-2 gap-y-3">
                                <div>
                                    <div className="text-[10px] font-semibold text-[#989FA7] uppercase tracking-wide mb-0.5">Payment Date</div>
                                    <div className="text-[13px] font-semibold text-gray-700">
                                        {row.status === 'PAID' ? new Date(row.updatedAt).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-[#989FA7] uppercase tracking-wide mb-0.5">Principal</div>
                                    <div className="text-[13px] font-semibold text-gray-700">
                                        Rs: {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-[#989FA7] uppercase tracking-wide mb-0.5">Interest</div>
                                    <div className="text-[13px] font-semibold text-gray-700">
                                        Rs: {(row.interest ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-[#989FA7] uppercase tracking-wide mb-0.5">Total Premium</div>
                                    <div className="text-[13px] font-bold text-blue-500">
                                        Rs: {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full text-left min-w-[480px]">
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