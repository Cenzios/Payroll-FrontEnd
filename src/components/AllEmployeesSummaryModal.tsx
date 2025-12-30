import { useState, useEffect } from 'react';
import { X, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import Toast from './Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AllEmployeesSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedEmployeeIds: string[];
    companyId: string;
    month: number;
    year: number;
}

interface EmployeeRow {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    workedDays: number;
    grossPay: number;
    netPay: number;
    deductions: number;
    employeeEPF: number;
    companyEPFETF: number;
}

interface SummaryData {
    metadata: {
        employeeCount: number;
        datePeriod: string;
        department: string;
        reportType: string;
        totalGrossPay: number;
    };
    employees: EmployeeRow[];
    totals: {
        grossPay: number;
        netPay: number;
        deductions: number;
        employeeEPF: number;
        companyEPFETF: number;
    };
}

const AllEmployeesSummaryModal = ({
    isOpen,
    onClose,
    selectedEmployeeIds,
    companyId,
    month,
    year
}: AllEmployeesSummaryModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (isOpen && selectedEmployeeIds.length > 0 && companyId) {
            fetchSummaryData();
        }
    }, [isOpen, selectedEmployeeIds, companyId, month, year]);

    const fetchSummaryData = async () => {
        setIsLoading(true);
        try {
            const response = await reportApi.getSelectedEmployeesSummary(
                companyId,
                selectedEmployeeIds,
                month,
                year
            );
            setSummaryData(response.data);
        } catch (error: any) {
            setToast({
                message: error.response?.data?.message || 'Failed to fetch summary data',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = () => {
        if (!summaryData) return;

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ALL EMPLOYEES – PAYROLL SUMMARY REPORT', 14, 15);

        // Metadata
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yPos = 30;

        doc.text(`Employee Count: ${summaryData.metadata.employeeCount}`, 14, yPos);
        doc.text(`Date Period: ${summaryData.metadata.datePeriod}`, 100, yPos);
        yPos += 7;
        doc.text(`Department: ${summaryData.metadata.department}`, 14, yPos);
        doc.text(`Report Type: ${summaryData.metadata.reportType}`, 100, yPos);
        yPos += 7;
        doc.text(`Total Gross Pay: RS ${summaryData.metadata.totalGrossPay.toLocaleString()}`, 14, yPos);
        yPos += 15;

        // Table
        const tableData = summaryData.employees.map(emp => [
            emp.employeeCode,
            emp.employeeName,
            emp.workedDays.toString(),
            `RS ${emp.grossPay.toLocaleString()}`,
            `RS ${emp.netPay.toLocaleString()}`,
            `RS ${emp.deductions.toLocaleString()}`,
            `RS ${emp.employeeEPF.toLocaleString()}`,
            `RS ${emp.companyEPFETF.toLocaleString()}`
        ]);

        // Totals Row
        tableData.push([
            'TOTAL AMOUNTS',
            '',
            '',
            `RS ${summaryData.totals.grossPay.toLocaleString()}`,
            `RS ${summaryData.totals.netPay.toLocaleString()}`,
            `RS ${summaryData.totals.deductions.toLocaleString()}`,
            `RS ${summaryData.totals.employeeEPF.toLocaleString()}`,
            `RS ${summaryData.totals.companyEPFETF.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Employee ID', 'Employee Name', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deduction', 'Employee EPF', 'Company EPF/ETF']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [31, 41, 55], fontStyle: 'bold' }, // Dark Gray
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fillColor = [37, 99, 235]; // Blue
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`Selected_Employees_Payroll_Summary_${summaryData.metadata.datePeriod.replace(' ', '_')}.pdf`);
        setToast({ message: 'PDF exported successfully', type: 'success' });
    };

    const exportExcel = () => {
        if (!summaryData) return;

        const wsData: any[][] = [
            ['ALL EMPLOYEES – PAYROLL SUMMARY REPORT'],
            [],
            ['Employee Count:', summaryData.metadata.employeeCount, '', 'Date Period:', summaryData.metadata.datePeriod],
            ['Department:', summaryData.metadata.department, '', 'Report Type:', summaryData.metadata.reportType],
            ['Total Gross Pay:', `RS ${summaryData.metadata.totalGrossPay.toLocaleString()}`],
            [],
            ['Breakdown Table'],
            ['Employee ID', 'Employee Name', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deduction', 'Employee EPF', 'Company EPF/ETF'],
            ...summaryData.employees.map(emp => [
                emp.employeeCode,
                emp.employeeName,
                emp.workedDays,
                emp.grossPay,
                emp.netPay,
                emp.deductions,
                emp.employeeEPF,
                emp.companyEPFETF
            ]),
            [
                'TOTAL AMOUNTS',
                '',
                '',
                summaryData.totals.grossPay,
                summaryData.totals.netPay,
                summaryData.totals.deductions,
                summaryData.totals.employeeEPF,
                summaryData.totals.companyEPFETF
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
        XLSX.writeFile(wb, `Selected_Employees_Summary_${summaryData.metadata.datePeriod.replace(' ', '_')}.xlsx`);
        setToast({ message: 'Excel exported successfully', type: 'success' });
    };

    const exportCSV = () => {
        if (!summaryData) return;

        const wsData: any[][] = [
            ['ALL EMPLOYEES – PAYROLL SUMMARY REPORT'],
            [],
            ['Employee Count:', summaryData.metadata.employeeCount, '', 'Date Period:', summaryData.metadata.datePeriod],
            ['Department:', summaryData.metadata.department, '', 'Report Type:', summaryData.metadata.reportType],
            ['Total Gross Pay:', `RS ${summaryData.metadata.totalGrossPay.toLocaleString()}`],
            [],
            ['Employee ID', 'Employee Name', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deduction', 'Employee EPF', 'Company EPF/ETF'],
            ...summaryData.employees.map(emp => [
                emp.employeeCode,
                emp.employeeName,
                emp.workedDays,
                emp.grossPay,
                emp.netPay,
                emp.deductions,
                emp.employeeEPF,
                emp.companyEPFETF
            ]),
            [
                'TOTAL AMOUNTS',
                '',
                '',
                summaryData.totals.grossPay,
                summaryData.totals.netPay,
                summaryData.totals.deductions,
                summaryData.totals.employeeEPF,
                summaryData.totals.companyEPFETF
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Selected_Employees_Summary_${summaryData.metadata.datePeriod.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'CSV exported successfully', type: 'success' });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">ALL EMPLOYEES – PAYROLL SUMMARY REPORT</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                        ) : summaryData ? (
                            <div className="space-y-8">
                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                    <div className="flex gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[120px]">Employee Count:</span>
                                        <span className="text-sm text-gray-600">{summaryData.metadata.employeeCount}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[120px]">Date Period:</span>
                                        <span className="text-sm text-gray-600">{summaryData.metadata.datePeriod}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[120px]">Department:</span>
                                        <span className="text-sm text-gray-600">{summaryData.metadata.department}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[120px]">Report Type:</span>
                                        <span className="text-sm text-gray-600">{summaryData.metadata.reportType}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm font-bold text-gray-700 min-w-[120px]">Total Gross Pay:</span>
                                        <span className="text-sm text-gray-600">RS: {summaryData.metadata.totalGrossPay.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Breakdown Table Section */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-gray-800">Breakdown Table</h3>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[#1f2937] text-white">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left font-medium border-x border-gray-700">Employee ID</th>
                                                        <th className="px-3 py-3 text-left font-medium border-x border-gray-700">Employee Name</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Worked Days</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Gross Pay</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">NetPay</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Deduction</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Employee EPF</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Company ETF/EPF</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {summaryData.employees.map((emp, index) => (
                                                        <tr key={index} className="hover:bg-gray-50 bg-white">
                                                            <td className="px-3 py-3 text-gray-900 border-x border-gray-200 text-center font-medium">{emp.employeeCode}</td>
                                                            <td className="px-3 py-3 text-gray-700 border-x border-gray-200">{emp.employeeName}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">{emp.workedDays}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.grossPay.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.netPay.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.deductions.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.employeeEPF.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.companyEPFETF.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-[#3b82f6] text-white">
                                                    <tr className="font-bold">
                                                        <td colSpan={3} className="px-3 py-3 uppercase">TOTAL AMOUNTS</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.grossPay.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.netPay.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.deductions.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.employeeEPF.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.companyEPFETF.toLocaleString()}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p>No data available to display.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 border-t border-gray-200 flex justify-center gap-4 bg-white">
                        <button
                            onClick={exportPDF}
                            disabled={!summaryData || summaryData.employees.length === 0}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-[#3b82f6] rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            disabled={!summaryData || summaryData.employees.length === 0}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-[#22c55e] rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Excel
                        </button>
                        <button
                            onClick={exportCSV}
                            disabled={!summaryData || summaryData.employees.length === 0}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-[#6b7280] rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default AllEmployeesSummaryModal;
