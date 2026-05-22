import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { useLazyGetCFormReportQuery } from '../store/apiSlice';
import Toast from '../components/Toast';
import * as XLSX from 'xlsx';
import { fillEPFFormC } from '../utils/fillEPFFormC';
import AlertBar from '../components/AlertBar';
import { useTrialStatus } from '../hooks/useTrialStatus';
import logo from '../assets/images/logo-login.svg';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const fmt = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CFormReport = () => {
    const { selectedCompanyId, user } = useAppSelector((state) => state.auth);
    const { handleTrialAction } = useTrialStatus();

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-based

    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [getCFormReport] = useLazyGetCFormReportQuery();
    const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

    const handleApply = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        setHasApplied(true);
        try {
            const res = await getCFormReport({
                companyId: selectedCompanyId,
                month: selectedMonth,
                year: selectedYear
            }).unwrap();
            setReportData(res.data || res);
        } catch (error: any) {
            setToast({
                message: error.response?.data?.message || 'Failed to fetch C-Form report',
                type: 'error'
            });
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedYear(currentDate.getFullYear());
        setSelectedMonth(currentDate.getMonth() + 1);
        setReportData(null);
        setHasApplied(false);
    };

    // Auto-fetch current month on initial load
    useEffect(() => {
        if (selectedCompanyId) {
            handleApply();
        }
    }, [selectedCompanyId]);

    const rows: any[] = reportData?.rows || [];
    const totals = reportData?.totals;
    const periodLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

    // ── Export PDF (fills official EPF Form C template) ───────────
    const exportPDF = async () => {
        if (!reportData || rows.length === 0) return;
        try {
            await fillEPFFormC({
                employees: rows.map((r: any) => ({
                    employeeName: r.employeeName,
                    nationalId: r.nationalId,
                    memberNo: r.memberNo,
                    basicPay: r.basicPay,
                    employerEpf: r.employerEpf,
                    employeeEpf: r.employeeEpf,
                    totalEarnings: r.totalEarnings,  // gross: basicPay + OT + allowances
                })),
                totals: {
                    basicPay: totals?.basicPay ?? 0,
                    employerEpf: totals?.employerEpf ?? 0,
                    employeeEpf: totals?.employeeEpf ?? 0,
                    totalEarnings: totals?.totalEarnings ?? 0,  // gross total
                },
                month: selectedMonth,
                year: selectedYear,
                companyName: reportData?.companyName,
                epfRegistrationNo: reportData?.epfRegistrationNo ?? '',
            });
        } catch (err: any) {
            setToast({ message: err.message || 'Failed to generate PDF', type: 'error' });
        }
    };

    // ── Export Excel ──────────────────────────────────────────────
    const exportExcel = () => {
        const wsData: any[] = [
            ['C-Form Summary Report'],
            [`Period: ${periodLabel}`],
            [],
            ["Employee's Name", 'National ID No.', 'Member No.', 'Total (Rs.)', 'Employer Contribution (Rs.)', 'Employee Contribution (Rs.)', 'Total Earnings (Rs.)'],
            ...rows.map((r: any) => [
                r.employeeName, r.nationalId, r.memberNo,
                (r.employerEpf + r.employeeEpf), r.employerEpf, r.employeeEpf, r.totalEarnings,
            ]),
        ];
        if (totals) {
            wsData.push(['Total', '', '', (totals.employerEpf + totals.employeeEpf), totals.employerEpf, totals.employeeEpf, totals.totalEarnings]);
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'C-Form');
        XLSX.writeFile(wb, `C-Form_${MONTHS[selectedMonth - 1]}_${selectedYear}.xlsx`);
    };

    // ── Export CSV ────────────────────────────────────────────────
    const exportCSV = () => {
        const wsData: any[] = [
            ['C-Form Summary Report'],
            [`Period: ${periodLabel}`],
            [],
            ["Employee's Name", 'National ID No.', 'Member No.', 'Total (Rs.)', 'Employer Contribution (Rs.)', 'Employee Contribution (Rs.)', 'Total Earnings (Rs.)'],
            ...rows.map((r: any) => [
                r.employeeName, r.nationalId, r.memberNo,
                (r.employerEpf + r.employeeEpf), r.employerEpf, r.employeeEpf, r.totalEarnings,
            ]),
        ];
        if (totals) {
            wsData.push(['Total', '', '', (totals.employerEpf + totals.employeeEpf), totals.employerEpf, totals.employeeEpf, totals.totalEarnings]);
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `C-Form_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`;
        link.click();
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
                                    <h1 className="text-[22px] font-bold text-[#1D1F24]">C-Form Report</h1>
                                </div>
                                <p className="text-[13px] text-[#989FA7] font-medium">Here's Your C-Form Report.</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="max-sm:hidden">
                        <PageHeader
                            title="C-Form Report"
                            subtitle="Here's Your C-Form History."
                        />
                    </div>

                    <div className='max-sm:mx-5  max-sm:pb-20'>
                        {/* Filter Section */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center gap-6 max-sm:gap-4 max-sm:w-full max-sm:flex-col">
                                <div className='flex flex-row gap-4'>
                                    {/* Year */}
                                    <div className="flex items-center gap-3 max-sm:flex-1">
                                        <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none min-w-[100px] max-sm:flex-1 max-sm:min-w-0"
                                        >
                                            {years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Month */}
                                    <div className="flex items-center gap-3 max-sm:flex-1">
                                        <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Month</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none min-w-[100px] max-sm:flex-1 max-sm:min-w-0"
                                        >
                                            {MONTHS.map((m, i) => (
                                                <option key={i + 1} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 ml-auto max-sm:ml-0 max-sm:w-full max-sm:items-center max-sm:flex-row">
                                    <button
                                        onClick={handleApply}
                                        disabled={isLoading}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 max-sm:flex-1 max-sm:py-2.5"
                                    >
                                        {isLoading ? 'Loading...' : 'Apply'}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors max-sm:flex-1 max-sm:py-2.5"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Card Header with export buttons */}
                            <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0 px-5 py-4 flex items-center justify-between max-sm:flex-col">
                                <h2 className="font-bold text-gray-800 max-sm:pb-2">C-Form Summary</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleTrialAction(e, exportPDF)}
                                        disabled={!reportData || rows.length === 0}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed max-sm:py-1 max-sm:text-xs max-sm:gap-1"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Export PDF
                                    </button>
                                    <button
                                        onClick={(e) => handleTrialAction(e, exportExcel)}
                                        disabled={!reportData || rows.length === 0}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed max-sm:py-1 max-sm:text-xs max-sm:gap-1"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                                    </button>
                                    <button
                                        onClick={(e) => handleTrialAction(e, exportCSV)}
                                        disabled={!reportData || rows.length === 0}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed max-sm:py-1 max-sm:text-xs max-sm:gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* Table body card */}
                            <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Sub-header row */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">All Employee</span>
                                    {reportData && (
                                        <span className="text-xs text-gray-400">
                                            Period: {periodLabel} &nbsp;|&nbsp; Employees: {String(rows.length).padStart(2, '0')}
                                        </span>
                                    )}
                                </div>

                                {/* Loading */}
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-24">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : !hasApplied ? (
                                    <div className="text-center py-24 text-gray-400 text-sm">
                                        Select a year and month, then click <span className="font-semibold text-blue-500">Apply</span> to load the report.
                                    </div>
                                ) : rows.length === 0 ? (
                                    <div className="text-center py-24 text-gray-400 text-sm">
                                        No salary records found for <span className="font-semibold">{periodLabel}</span>.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-[220px]">Employee's Name</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">National Idt. No.</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Member No</th>
                                                    {/* Grouped header */}
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Total (Rs.)</th>
                                                    <th colSpan={2} className="px-0 py-3 text-xs font-semibold text-gray-500 text-center border-l border-gray-100">
                                                        Contributions (Rs.)
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Total Earnings (Rs.)</th>
                                                </tr>
                                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                                    <th className="px-4 py-2"></th>
                                                    <th className="px-4 py-2"></th>
                                                    <th className="px-4 py-2"></th>
                                                    <th className="px-4 py-2"></th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 border-l border-gray-100">Employer</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500">Employee</th>
                                                    <th className="px-4 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {rows.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-[13px] font-medium text-gray-800">{row.employeeName}</td>
                                                        <td className="px-4 py-3 text-[13px] text-blue-400">{row.nationalId}</td>
                                                        <td className="px-4 py-3 text-[13px] text-blue-400">{row.memberNo}</td>
                                                        <td className="px-4 py-3 text-[13px] text-gray-600 text-right">{fmt(row.employerEpf + row.employeeEpf)}</td>
                                                        <td className="px-4 py-3 text-[13px] text-gray-600 border-l border-gray-100">{fmt(row.employerEpf)}</td>
                                                        <td className="px-4 py-3 text-[13px] text-gray-600">{fmt(row.employeeEpf)}</td>
                                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-700 text-right">{fmt(row.totalEarnings)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {totals && (
                                                <tfoot>
                                                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800" colSpan={3}>Total</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{fmt(totals.employerEpf + totals.employeeEpf)}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800 border-l border-gray-100">{fmt(totals.employerEpf)}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{fmt(totals.employeeEpf)}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{fmt(totals.totalEarnings)}</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
};

export default CFormReport;
