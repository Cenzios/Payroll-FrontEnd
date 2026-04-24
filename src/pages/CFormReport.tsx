import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAppSelector } from '../store/hooks';
import { salaryApi } from '../api/salaryApi';
import Toast from '../components/Toast';
import * as XLSX from 'xlsx';
import { fillEPFFormC } from '../utils/fillEPFFormC';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const fmt = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CFormReport = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-based

    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

    const handleApply = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        setHasApplied(true);
        try {
            const res = await salaryApi.getCFormReport(selectedCompanyId, selectedMonth, selectedYear);
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
                    totalEarnings: r.totalEarnings,
                })),
                totals: {
                    basicPay: totals?.basicPay ?? 0,
                    employerEpf: totals?.employerEpf ?? 0,
                    employeeEpf: totals?.employeeEpf ?? 0,
                    totalEarnings: totals?.totalEarnings ?? 0,
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
                r.basicPay, r.employerEpf, r.employeeEpf, r.totalEarnings,
            ]),
        ];
        if (totals) {
            wsData.push(['Total', '', '', totals.basicPay, totals.employerEpf, totals.employeeEpf, totals.totalEarnings]);
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
                r.basicPay, r.employerEpf, r.employeeEpf, r.totalEarnings,
            ]),
        ];
        if (totals) {
            wsData.push(['Total', '', '', totals.basicPay, totals.employerEpf, totals.employeeEpf, totals.totalEarnings]);
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
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <div className="shrink-0">
                    <PageHeader title="C-Form Report" subtitle="Here's your C-Form History." />

                    {/* Filter Section */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-center gap-6 flex-wrap">
                            {/* Year */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none min-w-[100px]"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Month */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none min-w-[130px]"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={handleApply}
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    {isLoading ? 'Loading...' : 'Apply'}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-y-auto">
                    {/* Card Header with export buttons */}
                    <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0 px-5 py-4 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800">C-Form Summary</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={exportPDF}
                                disabled={!reportData || rows.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FileText className="w-3.5 h-3.5" /> Export PDF
                            </button>
                            <button
                                onClick={exportExcel}
                                disabled={!reportData || rows.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                            </button>
                            <button
                                onClick={exportCSV}
                                disabled={!reportData || rows.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                                <td className="px-4 py-3 text-[13px] text-gray-600 text-right">{fmt(row.basicPay)}</td>
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
                                                <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{fmt(totals.basicPay)}</td>
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CFormReport;
