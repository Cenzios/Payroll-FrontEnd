import { useState, useEffect } from 'react';
import { Search, ChevronDown, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { useGetEmployeesQuery, useGetCompaniesQuery } from '../store/apiSlice';
import { salaryApi } from '../api/salaryApi';
import { exportEpfEtfReport } from '../utils/exportService';
import Toast from '../components/Toast';
import SingleMonthPicker from '../components/SingleMonthPicker';
import AlertBar from '../components/AlertBar';
import { useTrialStatus } from '../hooks/useTrialStatus';
import logo from '../assets/images/logo-login.svg';

const EpfEtfReport = () => {
    const { selectedCompanyId, user } = useAppSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { handleTrialAction } = useTrialStatus();

    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth());
    const [year, setYear] = useState(currentDate.getFullYear());

    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
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

    const fetchData = async (m?: number, y?: number) => {
        if (!selectedCompanyId) return;
        setIsLoading(true);

        const targetMonth = m !== undefined ? m : month;
        const targetYear = y !== undefined ? y : year;

        try {
            const response = await salaryApi.getSalaryReport(
                selectedCompanyId,
                targetMonth + 1,
                targetYear,
                targetMonth + 1,
                targetYear
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


    const handleReset = () => {
        const currentDate = new Date();
        setMonth(currentDate.getMonth());
        setYear(currentDate.getFullYear());
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
            startMonth: month,
            startYear: year,
            endMonth: month,
            endYear: year,
            totals
        });
        setIsExportOpen(false);
        setToast({ message: `${format.toUpperCase()} exported successfully`, type: 'success' });
    };


    const fmt = (val: number | undefined | null) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const MobileCard = ({ item, expandedId, setExpandedId }: {
        item: any,
        expandedId: string | null,
        setExpandedId: (id: string | null) => void
    }) => {
        const expanded = expandedId === item.employeeId;

        const initials = item.fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setExpandedId(expanded ? null : item.employeeId)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.fullName}</p>
                        <p className="text-xs text-gray-400">{item.employeeCode}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600 whitespace-nowrap mr-1">
                        Rs. {fmt(item.totalContribution)}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-2 pb-4 pt-3 space-y-2 mx-4 mb-3 border-t border-gray-300">
                        {[
                            { label: 'EPF No', value: item.epfNo },
                            { label: 'Basic Salary', value: fmt(item.basicSalary) },
                            { label: 'Emp EPF (8%)', value: fmt(item.empEpf) },
                            { label: 'Employer EPF (12%)', value: fmt(item.employerEpf) },
                            { label: 'ETF (3%)', value: fmt(item.etf) },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">{label}</span>
                                <span className="text-xs font-semibold text-gray-700">{value}</span>
                            </div>
                        ))}
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
                    <div className="hidden mt-6 max-sm:flex items-center justify-between pt-5 border-b border-gray-100">
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
                    <div className="hidden max-sm:block px-6 py-2 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className='px-3'>
                                <div className="inline-block rounded-sm">
                                    <h1 className="text-[22px] font-bold text-[#1D1F24]">EPF / ETF Summary Report</h1>
                                </div>
                                <p className="text-[13px] text-[#989FA7] font-medium">Here's Your EPF / ETF History.</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="max-sm:hidden">
                        <PageHeader
                            title="EPF / ETF Summary Report"
                            subtitle="Here's Your EPF / ETF History."
                        />
                    </div>

                    <div className='max-sm:mx-5  max-sm:pb-20'>
                        {/* Filters */}
                        <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className='flex flex-row gap-4'>
                                    {/* Search */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap max-sm:hidden">Search Employee</span>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search..."
                                                className="pl-9 pr-4 py-2 mr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56 focus:ring-2 focus:ring-blue-100 outline-none max-sm:w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Time Period */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap max-sm:hidden">Time Period</span>
                                        <SingleMonthPicker
                                            selectedMonth={month}
                                            selectedYear={year}
                                            onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
                                            onApply={(m, y) => fetchData(m, y)}
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 ml-auto max-sm:ml-0 max-sm:w-full max-sm:items-center max-sm:flex-row">
                                    <button
                                        onClick={handleReset}
                                        className="px-9 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-regular rounded-lg border border-gray-300 transition-colors max-sm:flex-1 max-sm:py-2.5"
                                    >
                                        Reset
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsExportOpen(!isExportOpen)}
                                            className="flex items-center gap-1.5 px-7 py-2 bg-white hover:bg-gray-50 text-[#407BFF] text-sm font-regular rounded-lg border border-[#407BFF33] transition-colors max-sm:flex-1 max-sm:py-2.5"
                                        >
                                            Export
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isExportOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                                                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('pdf'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-[#407BFF] hover:bg-red-50 transition-colors">
                                                        <FileText className="w-4 h-4" /> PDF
                                                    </button>
                                                    <div className="border-t border-gray-100" />
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('excel'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-[#407BFF] hover:bg-green-50 transition-colors">
                                                        <FileSpreadsheet className="w-4 h-4" /> Excel
                                                    </button>
                                                    <div className="border-t border-gray-100" />
                                                    <button onClick={(e) => handleTrialAction(e, () => handleExport('csv'))} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-regular text-[#407BFF] hover:bg-blue-50 transition-colors">
                                                        <Download className="w-4 h-4" /> CSV
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Content Wrapper */}
                        <div className="p-4 rounded-xl bg-white border border-[#00000014] flex flex-col flex-1 overflow-hidden
                        max-sm:bg-transparent max-sm:border-0 max-sm:p-0">

                            {/* Summary Footer */}
                            <div className="flex justify-between items-center gap-2 max-sm:overflow-x-auto max-sm:w-full max-sm:whitespace-nowrap max-sm:pb-3">
                                <div className="text-start border border-gray-300 pl-4 p-2 w-full rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-[#757575] mb-1">Employees</p>
                                    <p className="text-lg font-bold">{totals.count}</p>
                                </div>
                                <div className="text-start border border-gray-300 pl-4 p-2 w-full rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-[#757575] mb-1">Total Gross Pay</p>
                                    <p className="text-lg font-bold text-[#155390]">{fmt(totals.grossPay)}</p>
                                </div>
                                <div className="text-start border border-gray-300 pl-4 p-2 w-full rounded-lg">
                                    {/* <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Employee EPF</p> */}
                                    <p className="text-[10px] uppercase font-bold text-[#757575] mb-1">Total NET Pay</p>
                                    <p className="text-lg font-bold text-[#155390]">{fmt(totals.empEpf)}</p>
                                </div>
                                <div className="text-start border border-gray-300 pl-4 p-2 w-full rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-[#757575] mb-1">Employee EPF</p>
                                    <p className="text-lg font-bold text-[#757575]">{fmt(totals.employerEpf)}</p>
                                </div>
                                <div className="text-start border border-gray-300 pl-4 p-2 w-full rounded-lg">
                                    {/* <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">ETF</p> */}
                                    <p className="text-[10px] uppercase font-bold text-[#757575] mb-1">Company EPF/ETF</p>
                                    <p className="text-lg font-bold text-[#757575]">{fmt(totals.etf)}</p>
                                </div>
                                {/* <div className="pl-8 border-l border-gray-200 text-right w-full">
                                        <p className="text-[10px] uppercase font-bold text-[#2b74ff] mb-1">Total Contribution</p>
                                        <p className="text-xl font-bold text-[#2b74ff]">Rs {fmt(totals.totalContribution)}</p>
                                    </div> */}
                            </div>
                            {/* <p className="text-[10px] text-gray-400 text-right mt-4 italic">All values are display in LKR</p> */}


                            {/* Table */}
                            <div className="flex-1 mt-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-sm:hidden">
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
                            </div>

                            {/* Mobile cards */}
                            <div className="hidden max-sm:flex flex-col gap-3 mt-4">
                                <p className="text-base font-semibold text-gray-700 mb-1">Employee Records</p>
                                {isLoading ? (
                                    <div className="flex justify-center items-center gap-2 py-12 text-gray-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Loading report data...
                                    </div>
                                ) : filteredData.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-sm">
                                        No EPF/ETF data found for the selected period.
                                    </div>
                                ) : (
                                    filteredData.map((item) => (
                                        <MobileCard
                                            key={item.employeeId}
                                            item={item}
                                            expandedId={expandedId}
                                            setExpandedId={setExpandedId}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </div>
            </div>
        </div>
    );
};

export default EpfEtfReport;
