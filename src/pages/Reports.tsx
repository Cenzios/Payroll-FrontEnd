import { useState, useEffect } from 'react';
import { Search, FileText, Download, Loader2, FileSpreadsheet } from 'lucide-react';
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

        // ✅ LOG INPUT VALUES
        console.group('📊 Reports Page - Fetching Data');
        console.log('Selected Company ID:', selectedCompanyId);
        console.log('Date Range (UI State):', {
            startMonth,
            startYear,
            endMonth,
            endYear
        });
        console.log('Date Range (API Call):', {
            startMonth: startMonth + 1,
            startYear,
            endMonth: endMonth + 1,
            endYear
        });
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
            console.error('Response Headers:', error.response?.headers);
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

    // Initial Load
    useEffect(() => {
        checkAndUpdateData();
    }, [selectedCompanyId]);

    const handleApply = () => {
        // Validate date range
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
        const currentMonth = now.getMonth() + 1; // API monthNumber is 1-based

        const currentMonthKey = `${currentYear}-${currentMonth}`;

        setExpandedMonths(prev => {
            // Prevent overriding user interactions
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

    const exportPDF = () => {
        const filteredData = monthlyData.map(monthData => ({
            ...monthData,
            employees: selectedEmployeeIds.length > 0
                ? monthData.employees.filter((emp: any) => selectedEmployeeIds.includes(`${emp.employeeId}-${monthData.year}-${monthData.monthNumber}`))
                : monthData.employees
        }));

        exportPayrollSummaryReport('pdf', {
            monthlyData: filteredData,
            startMonth,
            startYear,
            endMonth,
            endYear
        });
        setToast({ message: 'PDF exported successfully', type: 'success' });
    };

    const exportExcel = () => {
        const filteredData = monthlyData.map(monthData => ({
            ...monthData,
            employees: selectedEmployeeIds.length > 0
                ? monthData.employees.filter((emp: any) => selectedEmployeeIds.includes(`${emp.employeeId}-${monthData.year}-${monthData.monthNumber}`))
                : monthData.employees
        }));

        exportPayrollSummaryReport('excel', {
            monthlyData: filteredData,
            startMonth,
            startYear,
            endMonth,
            endYear
        });
        setToast({ message: 'Excel exported successfully', type: 'success' });
    };

    const exportCSV = () => {
        const filteredData = monthlyData.map(monthData => ({
            ...monthData,
            employees: selectedEmployeeIds.length > 0
                ? monthData.employees.filter((emp: any) => selectedEmployeeIds.includes(`${emp.employeeId}-${monthData.year}-${monthData.monthNumber}`))
                : monthData.employees
        }));

        exportPayrollSummaryReport('csv', {
            monthlyData: filteredData,
            startMonth,
            startYear,
            endMonth,
            endYear
        });
        setToast({ message: 'CSV exported successfully', type: 'success' });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
                <div className="shrink-0">
                    <PageHeader
                        title="Payroll Summary Report"
                        subtitle="Here's your Payroll History."
                    />

                    {/* Filter Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="md:col-span-1">
                                <label className="text-sm font-semibold text-gray-600 block mb-2">Search Employee</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-gray-600 block mb-2">Time Period</label>
                                <MonthRangePicker
                                    startMonth={startMonth}
                                    startYear={startYear}
                                    endMonth={endMonth}
                                    endYear={endYear}
                                    onStartChange={(month, year) => {
                                        setStartMonth(month);
                                        setStartYear(year);
                                    }}
                                    onEndChange={(month, year) => {
                                        setEndMonth(month);
                                        setEndYear(year);
                                    }}
                                />
                            </div>

                            <div className="md:col-span-1 flex gap-3">
                                <button
                                    onClick={handleApply}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Toolbar */}
                    <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0 p-4 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800">Payroll Summary</h2>
                        <div className="flex gap-2">
                            <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> Export PDF
                            </button>
                            <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-100 transition-colors">
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                            </button>
                            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-100 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-6 flex-1">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : monthlyData.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                No payroll records found for the selected period.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {monthlyData.map((monthData) => {
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
                                })}
                            </div>
                        )}
                    </div>

                    {/* Overall Totals Footer */}
                    {monthlyData.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Overall Totals ({overallTotals.totalMonths} months)</h3>
                            <div className="grid grid-cols-5 gap-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{overallTotals.totalEmployees}</div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Employees</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">Rs {overallTotals.totalGrossPay.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Gross Pay</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">Rs {overallTotals.totalNetPay.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Net Pay</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">Rs {overallTotals.totalEmployeeEPF.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Employee EPF</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">Rs {overallTotals.totalCompanyEPFETF.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Company EPF/ETF</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </div>
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
