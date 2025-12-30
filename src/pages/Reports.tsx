import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, FileSpreadsheet, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MonthRangePicker from '../components/MonthRangePicker';
import MonthSection from '../components/MonthSection';
import { useAppSelector } from '../store/hooks';
import { salaryApi } from '../api/salaryApi';
import Toast from '../components/Toast';
import EmployeePayrollModal from '../components/EmployeePayrollModal';
import AllEmployeesSummaryModal from '../components/AllEmployeesSummaryModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; companyId: string } | null>(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    // Expand/collapse state for months
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const checkAndUpdateData = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        try {
            // API expects month 1-12, but our state is 0-11
            const response = await salaryApi.getSalaryReport(
                selectedCompanyId,
                startMonth + 1,
                startYear,
                endMonth + 1,
                endYear
            );
            const reportData = response.data;

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
                setToast({ message: error.message || 'Failed to fetch report', type: 'error' });
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

    const handleSelectEmployee = (employeeId: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const dateRangeText = `${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} - ${new Date(endYear, endMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        doc.text(`Payroll Summary Report`, 14, 15);
        doc.setFontSize(10);
        doc.text(dateRangeText, 14, 22);

        let startY = 30;
        monthlyData.forEach((monthData) => {
            doc.setFontSize(12);
            doc.text(`${monthData.month} ${monthData.year}`, 14, startY);
            startY += 5;

            const tableBody = monthData.employees.map((emp: any) => [
                emp.employeeCode || '-',
                emp.employeeName || '-',
                emp.workingDays,
                emp.netPay.toLocaleString(),
                emp.employeeEPF.toLocaleString(),
                emp.companyEPFETF.toLocaleString()
            ]);

            autoTable(doc, {
                startY,
                head: [['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF']],
                body: tableBody,
            });

            startY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save('Payroll_Summary_Report.pdf');
    };

    const exportExcel = () => {
        const wsData: any[] = [
            ['Payroll Summary Report'],
            [`${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} - ${new Date(endYear, endMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            []
        ];

        monthlyData.forEach((monthData) => {
            wsData.push([`${monthData.month} ${monthData.year}`]);
            wsData.push(['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF']);

            monthData.employees.forEach((emp: any) => {
                wsData.push([
                    emp.employeeCode || '-',
                    emp.employeeName || '-',
                    emp.workingDays,
                    emp.netPay,
                    emp.employeeEPF,
                    emp.companyEPFETF
                ]);
            });
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, "Payroll_Summary_Report.xlsx");
    };

    const exportCSV = () => {
        const wsData: any[] = [
            ['Payroll Summary Report'],
            [`${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} - ${new Date(endYear, endMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            []
        ];

        monthlyData.forEach((monthData) => {
            wsData.push([`${monthData.month} ${monthData.year}`]);
            wsData.push(['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF']);

            monthData.employees.forEach((emp: any) => {
                wsData.push([
                    emp.employeeCode || '-',
                    emp.employeeName || '-',
                    emp.workingDays,
                    emp.netPay,
                    emp.employeeEPF,
                    emp.companyEPFETF
                ]);
            });
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Payroll_Summary_Report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 min-h-screen flex flex-col">
                <header className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payroll Summary Report</h1>
                        <p className="text-sm text-gray-500 mt-1">Here's your Payroll History.</p>
                    </div>
                </header>

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
                        <button
                            onClick={() => setIsAllEmployeesModalOpen(true)}
                            disabled={selectedEmployeeIds.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 border border-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText className="w-3.5 h-3.5" /> View Selected
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
                                            setSelectedEmployee({ id, companyId });
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
