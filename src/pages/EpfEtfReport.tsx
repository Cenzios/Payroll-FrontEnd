import { useState, useEffect } from 'react';
import { Search, ChevronDown, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { useGetEmployeesQuery, useGetCompaniesQuery } from '../store/apiSlice';
import { salaryApi } from '../api/salaryApi';
import { exportEpfEtfReport } from '../utils/exportService';
import Toast from '../components/Toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const EpfEtfReport = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Selected Period (Defaults to Current Month)
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const [isLoading, setIsLoading] = useState(false);
    const [rawReportData, setRawReportData] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any[]>([]);
    const [totals, setTotals] = useState({
        count: 0,
        basicSalary: 0,
        grossPay: 0,
        empEpf: 0,
        employerEpf: 0,
        etf: 0,
        totalContribution: 0
    });

    const { data: companies } = useGetCompaniesQuery();
    const { data: employeesData } = useGetEmployeesQuery({
        companyId: selectedCompanyId || '',
        limit: 1000
    });

    const fetchData = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        try {
            const response = await salaryApi.getSalaryReport(
                selectedCompanyId,
                selectedMonth + 1,
                selectedYear,
                selectedMonth + 1,
                selectedYear
            );

            const monthlyData = response.data?.monthlyData || [];
            setRawReportData(monthlyData);
        } catch (error) {
            setToast({ message: 'Failed to load report data', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Aggregate data whenever rawReportData or employeesData changes
    useEffect(() => {
        if (!rawReportData.length) {
            setReportData([]);
            setTotals({ count: 0, basicSalary: 0, grossPay: 0, empEpf: 0, employerEpf: 0, etf: 0, totalContribution: 0 });
            return;
        }

        // Aggregate data by employee
        const employeeMap = new Map();

        rawReportData.forEach((month: any) => {
            month.employees.forEach((emp: any) => {
                if (!employeeMap.has(emp.employeeId)) {
                    const employeeInfo = employeesData?.employees.find(e => e.id === emp.employeeId);
                    employeeMap.set(emp.employeeId, {
                        employeeId: emp.employeeId,
                        employeeCode: emp.employeeCode || employeeInfo?.employeeId || '-',
                        fullName: emp.fullName || employeeInfo?.fullName || '-',
                        epfNo: employeeInfo?.epfNumber || emp.epfNumber || '-',
                        basicSalary: 0,
                        grossPay: 0,
                        empEpf: 0,
                        employerEpf: 0,
                        etf: 0,
                        totalContribution: 0
                    });
                }

                const record = employeeMap.get(emp.employeeId);
                const employeeInfo = employeesData?.employees.find(e => e.id === emp.employeeId);

                // Fields from API (try various naming conventions)
                const basicPay = emp.basicPay || 0;
                const empEpf = emp.employeeEPF || emp.employeeEpf || 0;
                const employerEpf = emp.employerEPF || emp.employerEpf || 0;
                const etf = emp.etfAmount || emp.etf || 0;

                // Fallback calculations if they are missing but EPF is enabled
                const isEpfEnabled = emp.epfEnabled ?? employeeInfo?.epfEnabled ?? (empEpf > 0);

                record.basicSalary += basicPay;
                record.grossPay += emp.grossPay || 0;

                if (empEpf > 0) {
                    record.empEpf += empEpf;
                    record.employerEpf += employerEpf || (basicPay * 0.12);
                    record.etf += etf || (basicPay * 0.03);
                } else if (isEpfEnabled && basicPay > 0) {
                    // If EPF is enabled but fields are missing, calculate them
                    record.empEpf += basicPay * 0.08;
                    record.employerEpf += basicPay * 0.12;
                    record.etf += basicPay * 0.03;
                }

                record.totalContribution = record.empEpf + record.employerEpf + record.etf;
            });
        });

        const aggregated = Array.from(employeeMap.values());
        setReportData(aggregated);

        // Calculate overall totals
        const overall = aggregated.reduce((acc, curr) => ({
            count: acc.count + 1,
            basicSalary: acc.basicSalary + curr.basicSalary,
            grossPay: acc.grossPay + curr.grossPay,
            empEpf: acc.empEpf + curr.empEpf,
            employerEpf: acc.employerEpf + curr.employerEpf,
            etf: acc.etf + curr.etf,
            totalContribution: acc.totalContribution + curr.totalContribution
        }), { count: 0, basicSalary: 0, grossPay: 0, empEpf: 0, employerEpf: 0, etf: 0, totalContribution: 0 });

        setTotals(overall);
    }, [rawReportData, employeesData]);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchData();
        }
    }, [selectedCompanyId]);

    const handleApply = () => fetchData();

    const handleReset = () => {
        setSelectedMonth(currentDate.getMonth());
        setSelectedYear(currentDate.getFullYear());
        setSearchTerm('');
    };

    const filteredData = reportData.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
        const selectedCompany = companies?.find(c => c.id === selectedCompanyId);
        exportEpfEtfReport(format, {
            companyName: selectedCompany?.name || 'Company Name',
            companyAddress: selectedCompany?.address || '',
            reportData: filteredData,
            startMonth: selectedMonth,
            startYear: selectedYear,
            endMonth: selectedMonth,
            endYear: selectedYear,
            totals
        });
        setIsExportOpen(false);
        setToast({ message: `${format.toUpperCase()} exported successfully`, type: 'success' });
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    const fmt = (val: number | undefined | null) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">

                <div className="shrink-0 mb-4">
                    <PageHeader
                        title="EPF / ETF Summary Report"
                        subtitle="Here's your EPF / ETF History."
                    />
                </div>

                {/* Filters */}
                <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4 flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Search Employee</span>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-transparent text-sm outline-none placeholder-gray-400 pl-6"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-0 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="flex flex-col min-w-[200px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Select Period</span>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                views={['month', 'year']}
                                value={dayjs(new Date(selectedYear, selectedMonth))}
                                maxDate={dayjs(new Date())}
                                onChange={(newValue) => {
                                    if (newValue && newValue.isValid()) {
                                        setSelectedYear(newValue.year());
                                        setSelectedMonth(newValue.month());
                                    }
                                }}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: {
                                            backgroundColor: "white",
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "0.75rem",
                                                "& fieldset": {
                                                    borderColor: "#e5e7eb",
                                                    transition: "all 0.2s ease-in-out",
                                                },
                                                "&:hover fieldset": {
                                                    borderColor: "#d1d5db",
                                                },
                                                "&.Mui-focused fieldset": {
                                                    borderColor: "#3b82f6",
                                                    borderWidth: "1px",
                                                    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
                                                },
                                            },
                                            "& .MuiInputBase-input": {
                                                paddingY: "9.5px",
                                                paddingX: "14px",
                                                fontSize: "0.875rem",
                                                color: "#1f2937",
                                            }
                                        }
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <button onClick={handleApply} className="px-6 py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Apply</button>
                        <button onClick={handleReset} className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors">Reset</button>

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
                                        <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-red-50 transition-colors">
                                            <FileText className="w-4 h-4" /> PDF
                                        </button>
                                        <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">
                                            <FileSpreadsheet className="w-4 h-4" /> Excel
                                        </button>
                                        <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-blue-50 transition-colors">
                                            <Download className="w-4 h-4" /> CSV
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr className="border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900">Employee ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900">Employee Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900">EPF No</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">Basic Salary</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">Emp EPF (8%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">Employer EPF (12%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">ETF (3%)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#2b74ff] text-right">Total Contribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Loading report data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                            No EPF/ETF data found for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.employeeId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-[#2b74ff]">{item.employeeCode}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{item.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{item.epfNo}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 text-right">{fmt(item.basicSalary)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 text-right">{fmt(item.empEpf)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 text-right">{fmt(item.employerEpf)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 text-right">{fmt(item.etf)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#2b74ff] text-right">{fmt(item.totalContribution)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-6 mt-auto">
                        <div className="flex justify-between items-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Employees</p>
                                <p className="text-lg font-bold text-gray-900">{totals.count}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Gross Pay</p>
                                <p className="text-lg font-bold text-gray-900">{fmt(totals.grossPay)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Employee EPF</p>
                                <p className="text-lg font-bold text-gray-900">{fmt(totals.empEpf)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Employer EPF</p>
                                <p className="text-lg font-bold text-gray-900">{fmt(totals.employerEpf)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">ETF</p>
                                <p className="text-lg font-bold text-gray-900">{fmt(totals.etf)}</p>
                            </div>
                            <div className="pl-8 border-l border-gray-200 text-right">
                                <p className="text-[10px] uppercase font-bold text-[#2b74ff] mb-1">Total Contribution</p>
                                <p className="text-xl font-bold text-[#2b74ff]">Rs {fmt(totals.totalContribution)}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-right mt-4 italic">All values are display in LKR</p>
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default EpfEtfReport;
