import { useState, useEffect } from 'react';
import { Search, FileText, Download, Loader2, FileSpreadsheet, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MonthRangePicker from '../components/MonthRangePicker';
import MonthSection from '../components/MonthSection';
import { useAppSelector } from '../store/hooks';
import { salaryApi } from '../api/salaryApi';
import Toast from '../components/Toast';
import EmployeePayrollModal from '../components/EmployeePayrollModal';
import AllEmployeesSummaryModal from '../components/AllEmployeesSummaryModal';
import PageHeader from '../components/PageHeader';
import { exportPayrollSummaryReport } from '../utils/exportService';

const Reports = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);

    // Date range filters
    const currentDate = new Date();
    const [startMonth, setStartMonth] = useState(currentDate.getMonth());
    const [startYear, setStartYear] = useState(currentDate.getFullYear());
    const [endMonth, setEndMonth] = useState(currentDate.getMonth());
    const [endYear, setEndYear] = useState(currentDate.getFullYear());

    // Search
    const [search, setSearch] = useState('');

    // Data
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [overallTotals, setOverallTotals] = useState({
        totalMonths: 0,
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalEmployeeEPF: 0,
        totalCompanyEPFETF: 0
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllEmployeesModalOpen, setIsAllEmployeesModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; companyId: string; month: number; year: number } | null>(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    // Expand/collapse state for months
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const checkAndUpdateData = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);

        console.group('📊 Reports Page - Fetching Data');
        console.log('Selected Company ID:', selectedCompanyId);
        console.log('Date Range (UI State):', { startMonth, startYear, endMonth, endYear });
        console.log('Date Range (API Call):', { startMonth: startMonth + 1, startYear, endMonth: endMonth + 1, endYear });
        console.groupEnd();

        try {
            const response = await salaryApi.getSalaryReport(
                selectedCompanyId,
                startMonth + 1,
                startYear,
                endMonth + 1,
                endYear
            );

            const reportData = response.data;
            console.log('✅ Report Data Received:', reportData);

            setMonthlyData(reportData.monthlyData || []);
            setOverallTotals(reportData.overallTotals || {
                totalMonths: 0,
                totalEmployees: 0,
                totalGrossPay: 0,
                totalNetPay: 0,
                totalEmployeeEPF: 0,
                totalCompanyEPFETF: 0
            });

        } catch (error: any) {
            console.group('❌ Reports Page Error');
            console.error('Error Object:', error);
            console.error('Status:', error.response?.status);
            console.error('Response Data:', error.response?.data);
            console.groupEnd();

            if (error.response?.status === 404) {
                setMonthlyData([]);
                setOverallTotals({
                    totalMonths: 0,
                    totalEmployees: 0,
                    totalGrossPay: 0,
                    totalNetPay: 0,
                    totalEmployeeEPF: 0,
                    totalCompanyEPFETF: 0
                });
            } else {
                setToast({
                    message: `Error ${error.response?.status}: ${error.response?.data?.message || error.message}`,
                    type: 'error'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAndUpdateData();
    }, [selectedCompanyId]);

    const handleApply = () => {
        const startDate = new Date(startYear, startMonth);
        const endDate = new Date(endYear, endMonth);
        if (startDate > endDate) {
            setToast({ message: 'Start date must be before or equal to end date', type: 'error' });
            return;
        }
        checkAndUpdateData();
    };

    useEffect(() => {
        if (monthlyData.length === 0) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentMonthKey = `${currentYear}-${currentMonth}`;

        setExpandedMonths(prev => {
            if (prev.size > 0) return prev;
            const newSet = new Set(prev);
            newSet.add(currentMonthKey);
            return newSet;
        });
    }, [monthlyData]);

    const handleReset = () => {
        const currentDate = new Date();
        setStartMonth(currentDate.getMonth());
        setStartYear(currentDate.getFullYear());
        setEndMonth(currentDate.getMonth());
        setEndYear(currentDate.getFullYear());
        setSearch('');
    };

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
            } else {
                newSet.add(monthKey);
            }
            return newSet;
        });
    };

    const handleSelectEmployee = (employeeId: string, month: number, year: number) => {
        const compositeKey = `${employeeId}-${year}-${month}`;
        setSelectedEmployeeIds(prev =>
            prev.includes(compositeKey)
                ? prev.filter(id => id !== compositeKey)
                : [...prev, compositeKey]
        );
    };

    const getFilteredData = () =>
        monthlyData.map(monthData => ({
            ...monthData,
            employees: selectedEmployeeIds.length > 0
                ? monthData.employees.filter((emp: any) =>
                    selectedEmployeeIds.includes(`${emp.employeeId}-${monthData.year}-${monthData.monthNumber}`)
                )
                : monthData.employees
        }));

    const exportPDF = () => {
        exportPayrollSummaryReport('pdf', { monthlyData: getFilteredData(), startMonth, startYear, endMonth, endYear });
        setToast({ message: 'PDF exported successfully', type: 'success' });
    };

    const exportExcel = () => {
        exportPayrollSummaryReport('excel', { monthlyData: getFilteredData(), startMonth, startYear, endMonth, endYear });
        setToast({ message: 'Excel exported successfully', type: 'success' });
    };

    const exportCSV = () => {
        exportPayrollSummaryReport('csv', { monthlyData: getFilteredData(), startMonth, startYear, endMonth, endYear });
        setToast({ message: 'CSV exported successfully', type: 'success' });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">

                {/* Header — keeps notification + profile via PageHeader */}
                <div className="shrink-0 mb-4">
                    <PageHeader
                        title="Summary Report"
                        subtitle="Here's your Payroll History."
                    />
                </div>

                {/* Filter Bar */}
                <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Search */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Search Employee</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-44 focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                            </div>
                        </div>

                        {/* Time Period */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Time Period</span>
                            <MonthRangePicker
                                startMonth={startMonth}
                                startYear={startYear}
                                endMonth={endMonth}
                                endYear={endYear}
                                onStartChange={(month, year) => { setStartMonth(month); setStartYear(year); }}
                                onEndChange={(month, year) => { setEndMonth(month); setEndYear(year); }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Apply */}
                            <button
                                onClick={handleApply}
                                className="px-5 py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-regular rounded-lg transition-colors"
                            >
                                Apply
                            </button>

                            {/* Reset */}
                            <button
                                onClick={handleReset}
                                className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-regular rounded-lg border border-gray-300 transition-colors"
                            >
                                Reset
                            </button>

                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsExportOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-white hover:bg-gray-50 text-green-600 text-sm font-regular rounded-lg border border-gray-300 transition-colors"
                                >
                                    Export
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isExportOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                            <button
                                                onClick={() => { exportPDF(); setIsExportOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" /> PDF
                                            </button>
                                            <div className="border-t border-gray-100" />
                                            <button
                                                onClick={() => { exportExcel(); setIsExportOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-green-600 hover:bg-green-50 transition-colors"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" /> Excel
                                            </button>
                                            <div className="border-t border-gray-100" />
                                            <button
                                                onClick={() => { exportCSV(); setIsExportOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <Download className="w-4 h-4" /> CSV
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Totals — TOP position (shown always, even if 0) */}
                <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 mb-4">
                    <div className="grid grid-cols-5 gap-4 divide-x divide-gray-100">
                        {/* Total Employees */}
                        <div className="text-center">
                            <div className="text-2xl font-regular text-gray-900">
                                {overallTotals.totalEmployees}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                Total Employees
                            </div>
                        </div>

                        {/* Total Gross Pay */}
                        <div className="text-center">
                            <div className="text-xl font-regular text-[#1f6feb]">
                                Rs. {overallTotals.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                Total Gross Pay
                            </div>
                        </div>

                        {/* Total Net Pay */}
                        <div className="text-center">
                            <div className="text-xl font-regular text-[#1f6feb]">
                                Rs. {overallTotals.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                Total Net Pay
                            </div>
                        </div>

                        {/* Total Employee EPF */}
                        <div className="text-center">
                            <div className="text-xl font-regular text-[#1f6feb]">
                                Rs. {overallTotals.totalEmployeeEPF.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                Total Employee EPF
                            </div>
                        </div>

                        {/* Total Company EPF/ETF */}
                        <div className="text-center">
                            <div className="text-xl font-regular text-[#1f6feb]">
                                Rs. {overallTotals.totalCompanyEPFETF.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                Total Company EPF/ETF
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content — Scrollable */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : monthlyData.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-sm">
                            No payroll records found for the selected period.
                        </div>
                    ) : (
                        monthlyData.map((monthData) => {
                            const monthKey = `${monthData.year}-${monthData.monthNumber}`;
                            return (
                                <MonthSection
                                    key={monthKey}
                                    year={monthData.year}
                                    month={monthData.month}
                                    monthNumber={monthData.monthNumber}
                                    status={monthData.status}
                                    employees={monthData.employees}
                                    totals={monthData.totals}
                                    isExpanded={expandedMonths.has(monthKey)}
                                    onToggle={() => toggleMonth(monthKey)}
                                    selectedEmployeeIds={selectedEmployeeIds}
                                    onSelectEmployee={handleSelectEmployee}
                                    onViewEmployee={(id, companyId) => {
                                        setSelectedEmployee({
                                            id,
                                            companyId,
                                            month: monthData.monthNumber,
                                            year: monthData.year
                                        });
                                        setIsModalOpen(true);
                                    }}
                                    companyId={selectedCompanyId || ''}
                                    searchQuery={search}
                                />
                            );
                        })
                    )}
                </div>

                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}
            </div>

            {/* Employee Payroll Modal */}
            {isModalOpen && selectedEmployee && (
                <EmployeePayrollModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    employeeId={selectedEmployee.id}
                    companyId={selectedEmployee.companyId}
                    month={selectedEmployee.month}
                    year={selectedEmployee.year}
                />
            )}

            {/* All Employees Summary Modal */}
            {isAllEmployeesModalOpen && (
                <AllEmployeesSummaryModal
                    isOpen={isAllEmployeesModalOpen}
                    onClose={() => setIsAllEmployeesModalOpen(false)}
                    selectedEmployeeIds={selectedEmployeeIds}
                    companyId={selectedCompanyId || ''}
                    month={startMonth + 1}
                    year={startYear}
                />
            )}
        </div>
    );
};

export default Reports;