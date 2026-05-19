import { useState, useEffect } from 'react';
import { ChevronDown, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { useGetEmployeesQuery, useGetSalaryHistoryQuery, useGetCompaniesQuery } from '../store/apiSlice';
import { exportBankAdviceReport } from '../utils/exportService';
import Toast from '../components/Toast';
import AlertBar from '../components/AlertBar';
import { useTrialStatus } from '../hooks/useTrialStatus';
import logo from '../assets/images/logo-login.svg';

const BankAdviceReport = () => {
    const { selectedCompanyId, user } = useAppSelector((state) => state.auth);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { handleTrialAction } = useTrialStatus();

    // Filters
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [appliedFilters, setAppliedFilters] = useState({ month: currentDate.getMonth(), year: currentDate.getFullYear() });
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Data fetching
    const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({
        companyId: selectedCompanyId || '',
        status: 'ACTIVE',
        limit: 1000 // Get all active employees
    });

    const { data: salaryHistory, isLoading: isLoadingSalary } = useGetSalaryHistoryQuery({
        companyId: selectedCompanyId || '',
        month: appliedFilters.month + 1,
        year: appliedFilters.year
    }, {
        skip: !selectedCompanyId
    });

    const { data: companies } = useGetCompaniesQuery();

    const [bankReportData, setBankReportData] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (employeesData && salaryHistory) {
            const merged = employeesData.employees.map(emp => {
                const salaryRecord = salaryHistory.find(s => s.employeeId === emp.id);

                return {
                    id: emp.id,
                    employeeCode: emp.employeeId,
                    fullName: emp.fullName,
                    accountHolderName: emp.accountHolderName || emp.fullName,
                    bankName: emp.bankName || '-',
                    branchName: emp.branchName || '-',
                    accountNumber: emp.accountNumber || '-',
                    amount: salaryRecord ? (salaryRecord.netSalary || salaryRecord.netPay || 0) : 0
                };
            }).filter(item => item.amount > 0);

            setBankReportData(merged);
            setTotalAmount(merged.reduce((sum, item) => sum + item.amount, 0));
        }
    }, [employeesData, salaryHistory]);

    const handleApply = () => {
        setAppliedFilters({ month: selectedMonth, year: selectedYear });
    };

    const handleReset = () => {
        setSelectedMonth(currentDate.getMonth());
        setSelectedYear(currentDate.getFullYear());
        setAppliedFilters({ month: currentDate.getMonth(), year: currentDate.getFullYear() });
    };

    const getExportData = () => {
        const selectedCompany = companies?.find(c => c.id === selectedCompanyId);
        return {
            companyName: selectedCompany?.name || 'Company Name',
            companyAddress: selectedCompany?.address || '',
            reportData: bankReportData,
            month: appliedFilters.month,
            year: appliedFilters.year,
            totalAmount
        };
    };

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
        exportBankAdviceReport(format, getExportData());
        setIsExportOpen(false);
        setToast({ message: `${format.toUpperCase()} exported successfully`, type: 'success' });
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    const MobileCard = ({ item, expandedId, setExpandedId }: {
        item: any,
        expandedId: string | null,
        setExpandedId: (id: string | null) => void
    }) => {
        const expanded = expandedId === item.id;

        const initials = item.accountHolderName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.accountHolderName}</p>
                        <p className="text-xs text-gray-400">{item.employeeCode}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800 whitespace-nowrap mr-1">
                        Rs {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-4 pb-4 pt-3 bg-blue-50 grid grid-cols-2 gap-x-4 gap-y-3 mx-4 mb-3 rounded-xl">
                        <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Bank Name</p>
                            <p className="text-sm font-semibold text-gray-800">{item.bankName}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Branch</p>
                            <p className="text-sm font-semibold text-gray-800">{item.branchName}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[11px] text-gray-400 mb-0.5">Account Number</p>
                            <p className="text-sm font-semibold text-gray-800 font-mono">{item.accountNumber}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
            <AlertBar />

            {/* Margin bottom gap after the banner */}
            <div className="-mb-4 shrink-0"></div>

            <div className="flex flex-1 overflow-hidden relative w-full translate-x-0 md:translate-x-0">
                <Sidebar />

                <div className="flex-1 ml-0 md:ml-64 md:p-6 h-screen overflow-hidden flex flex-col">

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
                                    <h1 className="text-[22px] font-bold text-[#1D1F24]">Bank Advice Report</h1>
                                </div>
                                <p className="text-[13px] text-[#989FA7] font-medium">Here's Your Bank Advice Report.</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="max-sm:hidden">
                        <PageHeader
                            title="Bank Advice Report"
                            subtitle="Here's Your Bank Advice Report."
                        />
                    </div>

                    <div className='max-sm:mx-5  max-sm:pb-20'>
                        {/* Filters */}
                        <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                            <div className="flex items-center gap-6 max-sm:gap-4 max-sm:w-full max-sm:flex-col">
                                <div className='flex flex-row gap-4'>
                                    <div className="flex items-center gap-3 max-sm:flex-1">
                                        <span className="text-sm font-medium text-gray-600">Year</span>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 min-w-[100px] max-sm:flex-1 max-sm:min-w-0"
                                        >
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 max-sm:flex-1">
                                        <span className="text-sm font-medium text-gray-600">Month</span>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 min-w-[120px] max-sm:flex-1 max-sm:min-w-0"
                                        >
                                            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 ml-auto max-sm:ml-0 max-sm:w-full max-sm:items-center max-sm:flex-row">
                                    <button
                                        onClick={handleApply}
                                        className="px-6 py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors max-sm:flex-1 max-sm:py-2.5"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors max-sm:flex-1 max-sm:py-2.5"
                                    >
                                        Reset
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsExportOpen(!isExportOpen)}
                                            className="flex items-center gap-1.5 px-6 py-2 bg-white hover:bg-gray-50 text-green-600 text-sm font-medium rounded-lg border border-green-200 transition-colors max-sm:flex-1 max-sm:py-2.5"
                                        >
                                            Export
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isExportOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                                                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('pdf'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                                        <FileText className="w-4 h-4" /> PDF
                                                    </button>
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('excel'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">
                                                        <FileSpreadsheet className="w-4 h-4" /> Excel
                                                    </button>
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('csv'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                                        <Download className="w-4 h-4" /> CSV
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-sm:hidden">
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-gray-50 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900">Employee ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900">Account Holder Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900">Bank Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900">Branch</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900">Account Number</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoadingEmployees || isLoadingSalary ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Loading report data...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : bankReportData.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                    No bank advice data found for the selected period.
                                                </td>
                                            </tr>
                                        ) : (
                                            bankReportData.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-400">{item.employeeCode}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{item.accountHolderName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{item.bankName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{item.branchName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.accountNumber}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right">
                                                        Rs {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Footer */}
                            {!isLoadingEmployees && !isLoadingSalary && bankReportData.length > 0 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-4">
                                    <span className="text-sm font-bold text-blue-600">Total Contribution</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        Rs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Mobile cards */}
                        <div className="hidden max-sm:flex flex-col gap-3">
                            {isLoadingEmployees || isLoadingSalary ? (
                                <div className="flex justify-center items-center gap-2 py-12 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Loading report data...
                                </div>
                            ) : bankReportData.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    No bank advice data found for the selected period.
                                </div>
                            ) : (
                                <>
                                    {bankReportData.map((item) => (
                                        <MobileCard
                                            key={item.id}
                                            item={item}
                                            expandedId={expandedId}
                                            setExpandedId={setExpandedId}
                                        />))}
                                    {bankReportData.length > 0 && (
                                        <div className="bg-blue-50 rounded-2xl px-5 py-5 flex flex-col items-center gap-1 mt-1 border border-blue-200">
                                            <span className="text-sm font-medium text-blue-400">Total Contribution</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                Rs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
};

export default BankAdviceReport;
