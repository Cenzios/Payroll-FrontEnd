import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, FileSpreadsheet, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAppSelector } from '../store/hooks';
import { salaryApi } from '../api/salaryApi';
import Toast from '../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    // Data
    const [salaryData, setSalaryData] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        totalEmployeeEpf: 0,
        totalCompanyContrib: 0
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const checkAndUpdateData = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        try {
            // API expects month 1-12
            const response = await salaryApi.getSalaryReport(selectedCompanyId, month + 1, year);
            const reportData = response.data; // Access the 'data' property of the response object

            setSalaryData(reportData.employees || []);

            // Use Backend Totals if available, or calculate (Backend likely provides totals)
            // report.service.ts usually returns { employees: [], totals: { totalEmployees, ... } }
            if (reportData.totals) {
                setSummary({
                    totalEmployees: reportData.totals.totalEmployees || 0,
                    totalGross: reportData.totals.totalGrossPay || 0,
                    totalNet: reportData.totals.totalNetPay || 0,
                    totalEmployeeEpf: reportData.totals.totalEmployeeEPF || 0,
                    totalCompanyContrib: reportData.totals.totalCompanyEPFETF || 0
                });
            } else {
                // Fallback calculation if backend doesn't return totals
                const records: any[] = reportData.employees || [];
                const newSummary = records.reduce((acc, curr) => ({
                    totalEmployees: acc.totalEmployees + 1,
                    totalGross: acc.totalGross + (Number(curr.basicPay) || 0),
                    totalNet: acc.totalNet + (Number(curr.netSalary) || 0),
                    totalEmployeeEpf: acc.totalEmployeeEpf + (Number(curr.employeeEPF) || 0),
                    totalCompanyContrib: acc.totalCompanyContrib + (Number(curr.employerEPF || 0) + Number(curr.etfAmount || 0))
                }), {
                    totalEmployees: 0,
                    totalGross: 0,
                    totalNet: 0,
                    totalEmployeeEpf: 0,
                    totalCompanyContrib: 0
                });
                setSummary(newSummary);
            }

        } catch (error: any) {
            // If 404 means no records, handle gracefully
            if (error.response?.status === 404) {
                setSalaryData([]);
                setSummary({ totalEmployees: 0, totalGross: 0, totalNet: 0, totalEmployeeEpf: 0, totalCompanyContrib: 0 });
            } else {
                setToast({ message: error.message || 'Failed to fetch report', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Load & Apply
    useEffect(() => {
        checkAndUpdateData();
    }, [selectedCompanyId]); // Only reload if company changes initially. Manually trigger for filters? 
    // Requirement "Apply button". So remove auto-fetch on state change, only on Apply.
    // However, good UX is auto-fetch or initial fetch. I'll do initial fetch, then Apply button triggers re-fetch.

    const handleApply = () => {
        checkAndUpdateData();
    };

    const handleReset = () => {
        setMonth(new Date().getMonth());
        setYear(new Date().getFullYear());
        setSearch('');
        // checkAndUpdateData(); // Optional: Auto fetch on reset?
    };

    // Filter LogicFrontend-side search? Or API search?
    // Requirement: "Search Employee (by name / employee ID)" in Top Filters.
    // If API supports search, pass it. API def: GET /api/v1/reports/company?companyId=&month=&year=
    // Doesn't explicitly say "search" param. So I will filter client-side.
    const filtereddata = salaryData.filter(record => {
        const query = search.toLowerCase();
        // Backend returns employeeCode and employeeName directly
        const name = record.employeeName?.toLowerCase() || '';
        const id = record.employeeCode?.toLowerCase() || '';
        return name.includes(query) || id.includes(query);
    });

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Payroll Summary Report - ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 20);

        const tableBody = filtereddata.map(row => [
            row.employeeCode || '-',
            row.employeeName || '-',
            row.workingDays,
            parseFloat(row.netPay || row.netSalary).toLocaleString() || '0',
            parseFloat(row.employeeEPF).toLocaleString() || '0',
            parseFloat(row.companyEPFETF || (row.employerEPF + row.etfAmount)).toLocaleString() || '0'
        ]);

        autoTable(doc, {
            startY: 30,
            head: [['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF']],
            body: tableBody,
        });

        doc.save('Salary_Report.pdf');
    };

    const exportExcel = () => {
        const wsData = [
            ['Payroll Summary Report', `${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF'],
            ...filtereddata.map(row => [
                row.employeeCode || '-',
                row.employeeName || '-',
                row.workingDays,
                row.netPay || row.netSalary,
                row.employeeEPF,
                row.companyEPFETF || (parseFloat(row.employerEPF || 0) + parseFloat(row.etfAmount || 0))
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, "Salary_Report.xlsx");
    };

    const exportCSV = () => {
        const wsData = [
            ['Payroll Summary Report', `${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Emp ID', 'Name', 'Days', 'Net Pay', 'Emp EPF', 'Comp EPF/ETF'],
            ...filtereddata.map(row => [
                row.employeeCode || '-',
                row.employeeName || '-',
                row.workingDays,
                row.netPay || row.netSalary,
                row.employeeEPF,
                row.companyEPFETF || (parseFloat(row.employerEPF || 0) + parseFloat(row.etfAmount || 0))
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Salary_Report.csv");
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
                            <div className="flex gap-4">
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>
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
                                className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Rest
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
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

                    {/* Table Header Info */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">All Employee</h3>
                                <p className="text-xs text-gray-500 mt-1">Period: {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })} | Employees: {filtereddata.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-200">Employee ID</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Employee Name</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Working Days</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Net Pay</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Employee EPF</th>
                                    <th className="px-6 py-3 border-b border-gray-200">Company ETF/EPF</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex justify-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
                                        </td>
                                    </tr>
                                ) : filtereddata.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No records found.</td>
                                    </tr>
                                ) : (
                                    filtereddata.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-3 font-semibold text-gray-900">{record.employeeCode || '-'}</td>
                                            <td className="px-6 py-3 text-gray-700">{record.employeeName || '-'}</td>
                                            <td className="px-6 py-3 text-gray-600">{record.workingDays}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900">Rs {Number(record.netPay || record.netSalary).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-gray-600">Rs: {Number(record.employeeEPF).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-gray-600">Rs: {Number(record.companyEPFETF || (Number(record.employerEPF || 0) + Number(record.etfAmount || 0))).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button className="px-3 py-1 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 text-xs transition-colors">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Summary */}
                    <div className="bg-gray-50 border-t border-gray-200 p-6">
                        <div className="grid grid-cols-5 gap-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Employees</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">Rs: {summary.totalGross.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Gross Pay</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">Rs: {summary.totalNet.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Net Pay</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">Rs: {summary.totalEmployeeEpf.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Employee EPF</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">Rs: {summary.totalCompanyContrib.toLocaleString()}</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Company EPF/ETF</div>
                            </div>
                        </div>
                    </div>
                </div>

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
};

export default Reports;
