import { useState, useEffect } from 'react';
import { ChevronDown, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { useGetEmployeesQuery, useGetSalaryHistoryQuery, useGetCompaniesQuery } from '../store/apiSlice';
import { exportBankAdviceReport } from '../utils/exportService';
import Toast from '../components/Toast';

const BankAdviceReport = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filters
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [appliedFilters, setAppliedFilters] = useState({ month: currentDate.getMonth(), year: currentDate.getFullYear() });

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

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">

                <div className="shrink-0 mb-4">
                    <PageHeader
                        title="Bank Advice Report"
                        subtitle="Here's your Bank Advice Report."
                    />
                </div>

                {/* Filters */}
                <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Year</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 min-w-[100px]"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Month</span>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 min-w-[120px]"
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleApply}
                                className="px-6 py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
                            >
                                Reset
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setIsExportOpen(!isExportOpen)}
                                    className="flex items-center gap-1.5 px-6 py-2 bg-white hover:bg-gray-50 text-green-600 text-sm font-medium rounded-lg border border-green-200 transition-colors"
                                >
                                    Export
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isExportOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                            <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                                <FileText className="w-4 h-4" /> PDF
                                            </button>
                                            <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">
                                                <FileSpreadsheet className="w-4 h-4" /> Excel
                                            </button>
                                            <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
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
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
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
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default BankAdviceReport;
