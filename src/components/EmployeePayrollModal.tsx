import { useState, useEffect } from 'react';
import { X, Loader2, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import Toast from './Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface EmployeePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    companyId: string;
}

interface MonthlyData {
    month: string;
    workedDays: number;
    grossPay: number;
    netPay: number;
    deductions: number;
    employeeEPF: number;
    companyEPFETF: number;
}

interface EmployeeData {
    employeeName: string;
    employeeCode: string;
    designation: string;
    dailyRate: number;
    joinedDate: string;
    monthlyBreakdown: MonthlyData[];
    annualTotals: {
        workedDays: number;
        grossPay: number;
        netPay: number;
        deductions: number;
        employeeEPF: number;
        companyEPFETF: number;
    };
}

const EmployeePayrollModal = ({ isOpen, onClose, employeeId, companyId }: EmployeePayrollModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (isOpen && employeeId && companyId) {
            fetchEmployeeData();
        }
    }, [isOpen, employeeId, companyId]);

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            console.log('Fetching data for:', { employeeId, companyId });
            const response = await reportApi.getEmployeePayrollSummary(employeeId, companyId);
            console.log('API Response:', response);

            // The API returns { success, message, data: {...} }
            // The reportApi.getEmployeePayrollSummary already returns response.data from axios
            // So we need to access response.data to get the actual employee data
            const actualData = response.data || response;
            console.log('Setting employee data:', actualData);
            setEmployeeData(actualData);
        } catch (error: any) {
            console.error('Error fetching employee data:', error);
            setToast({
                message: error.response?.data?.message || 'Failed to fetch employee data',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = () => {
        if (!employeeData) return;

        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYROLL SUMMARY REPORT', 14, 15);

        // Employee Information
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        let yPos = 30;

        doc.text(`Employee Name: ${employeeData.employeeName}`, 14, yPos);
        doc.text(`Employee ID: ${employeeData.employeeCode}`, 120, yPos);
        yPos += 7;

        doc.text(`Position: ${employeeData.designation}`, 14, yPos);
        doc.text(`Daily Rate: RS ${employeeData.dailyRate.toLocaleString()}`, 120, yPos);
        yPos += 7;

        doc.text(`Joined Date: ${employeeData.joinedDate}`, 14, yPos);
        yPos += 10;

        // Monthly Breakdown Table
        const tableData = employeeData.monthlyBreakdown.map(row => [
            row.month,
            row.workedDays.toString(),
            `RS ${row.grossPay.toLocaleString()}`,
            `RS ${row.netPay.toLocaleString()}`,
            `RS ${row.deductions.toLocaleString()}`,
            `RS ${row.employeeEPF.toLocaleString()}`,
            `RS ${row.companyEPFETF.toLocaleString()}`
        ]);

        // Add totals row
        tableData.push([
            'ANNUAL TOTALS',
            employeeData.annualTotals.workedDays.toString(),
            `RS ${employeeData.annualTotals.grossPay.toLocaleString()}`,
            `RS ${employeeData.annualTotals.netPay.toLocaleString()}`,
            `RS ${employeeData.annualTotals.deductions.toLocaleString()}`,
            `RS ${employeeData.annualTotals.employeeEPF.toLocaleString()}`,
            `RS ${employeeData.annualTotals.companyEPFETF.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Month', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deductions', 'Employee EPF', 'Company EPF/ETF']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
            footStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fillColor = [59, 130, 246];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save(`${employeeData.employeeCode}_Payroll_Summary.pdf`);
        setToast({ message: 'PDF exported successfully', type: 'success' });
    };

    const exportExcel = () => {
        if (!employeeData) return;

        const wsData: any[][] = [
            ['PAYROLL SUMMARY REPORT'],
            [],
            ['Employee Name:', employeeData.employeeName, '', 'Employee ID:', employeeData.employeeCode],
            ['Position:', employeeData.designation, '', 'Daily Rate:', `RS ${employeeData.dailyRate.toLocaleString()}`],
            ['Joined Date:', employeeData.joinedDate],
            [],
            ['Monthly Breakdown'],
            ['Month', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deductions', 'Employee EPF', 'Company EPF/ETF'],
            ...employeeData.monthlyBreakdown.map(row => [
                row.month,
                row.workedDays,
                row.grossPay,
                row.netPay,
                row.deductions,
                row.employeeEPF,
                row.companyEPFETF
            ]),
            [
                'ANNUAL TOTALS',
                employeeData.annualTotals.workedDays,
                employeeData.annualTotals.grossPay,
                employeeData.annualTotals.netPay,
                employeeData.annualTotals.deductions,
                employeeData.annualTotals.employeeEPF,
                employeeData.annualTotals.companyEPFETF
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
        XLSX.writeFile(wb, `${employeeData.employeeCode}_Payroll_Summary.xlsx`);
        setToast({ message: 'Excel exported successfully', type: 'success' });
    };

    const exportCSV = () => {
        if (!employeeData) return;

        const wsData: any[][] = [
            ['PAYROLL SUMMARY REPORT'],
            [],
            ['Employee Name:', employeeData.employeeName, '', 'Employee ID:', employeeData.employeeCode],
            ['Position:', employeeData.designation, '', 'Daily Rate:', `RS ${employeeData.dailyRate.toLocaleString()}`],
            ['Joined Date:', employeeData.joinedDate],
            [],
            ['Monthly Breakdown'],
            ['Month', 'Worked Days', 'Gross Pay', 'Net Pay', 'Deductions', 'Employee EPF', 'Company EPF/ETF'],
            ...employeeData.monthlyBreakdown.map(row => [
                row.month,
                row.workedDays,
                row.grossPay,
                row.netPay,
                row.deductions,
                row.employeeEPF,
                row.companyEPFETF
            ]),
            [
                'ANNUAL TOTALS',
                employeeData.annualTotals.workedDays,
                employeeData.annualTotals.grossPay,
                employeeData.annualTotals.netPay,
                employeeData.annualTotals.deductions,
                employeeData.annualTotals.employeeEPF,
                employeeData.annualTotals.companyEPFETF
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${employeeData.employeeCode}_Payroll_Summary.csv`);
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
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">PAYROLL SUMMARY REPORT</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : employeeData ? (
                            <>
                                {/* Employee Information */}
                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Employee Name:</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">{employeeData.employeeName}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Employee ID:</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">{employeeData.employeeCode}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Position:</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">{employeeData.designation}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Daily Rate:</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">RS: {employeeData.dailyRate.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Joined Date:</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">{employeeData.joinedDate}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Breakdown Table */}
                                <div className="bg-white rounded-lg border border-gray-200">
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-800">Monthly Breakdown</h3>
                                    </div>

                                    {employeeData.monthlyBreakdown.length === 0 ? (
                                        <div className="px-6 py-12 text-center text-gray-500">
                                            No salary data available
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-800 text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold">Month</th>
                                                        <th className="px-4 py-3 text-center font-semibold">Worked Days</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Gross Pay</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Net Pay</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Deductions</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Employee EPF</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Company EPF/ETF</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {employeeData.monthlyBreakdown.map((row, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-900">{row.month}</td>
                                                            <td className="px-4 py-3 text-center text-gray-700">{row.workedDays}</td>
                                                            <td className="px-4 py-3 text-right text-gray-900">RS: {row.grossPay.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right text-gray-900">RS: {row.netPay.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right text-gray-900">RS: {row.deductions.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right text-gray-900">RS: {row.employeeEPF.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right text-gray-900">RS: {row.companyEPFETF.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {/* Annual Totals Footer */}
                                                <tfoot className="bg-blue-600 text-white">
                                                    <tr>
                                                        <td className="px-4 py-3 font-bold text-left">ANNUAL TOTALS</td>
                                                        <td className="px-4 py-3 font-bold text-center">{employeeData.annualTotals.workedDays}</td>
                                                        <td className="px-4 py-3 font-bold text-right">RS: {employeeData.annualTotals.grossPay.toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-bold text-right">RS: {employeeData.annualTotals.netPay.toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-bold text-right">RS: {employeeData.annualTotals.deductions.toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-bold text-right">RS: {employeeData.annualTotals.employeeEPF.toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-bold text-right">RS: {employeeData.annualTotals.companyEPFETF.toLocaleString()}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-center items-center h-64 text-gray-500">
                                No data available
                            </div>
                        )}
                    </div>

                    {/* Footer - Export Buttons */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button
                            onClick={exportPDF}
                            disabled={!employeeData || employeeData.monthlyBreakdown.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            disabled={!employeeData || employeeData.monthlyBreakdown.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Excel
                        </button>
                        <button
                            onClick={exportCSV}
                            disabled={!employeeData || employeeData.monthlyBreakdown.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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

export default EmployeePayrollModal;
