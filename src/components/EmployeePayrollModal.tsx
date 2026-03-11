import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, FileSpreadsheet, Download, ChevronDown, ChevronRight } from 'lucide-react';
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
    month: number;
    year: number;
}

interface MonthlyData {
    month: string;
    workedDays: number;
    basicPay: number;
    otHours: number;
    otAmount: number;
    grossPay: number;
    netPay: number;
    tax: number;
    salaryAdvance: number;
    deductions: number;
    employeeEPF: number;
    companyEPFETF: number;
    allowances?: { type: string, amount: number }[];
    customDeductions?: { type: string, amount: number }[];
}

interface EmployeeData {
    employeeName: string;
    employeeCode: string;
    designation: string;
    basicSalary: number;
    joinedDate: string;
    monthlyBreakdown: MonthlyData[];
    annualTotals: {
        workedDays: number;
        basicPay: number;
        otAmount: number;
        grossPay: number;
        netPay: number;
        tax: number;
        salaryAdvance: number;
        deductions: number;
        employeeEPF: number;
        companyEPFETF: number;
    };
}

const EmployeePayrollModal = ({ isOpen, onClose, employeeId, companyId, month, year }: EmployeePayrollModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
    };

    useEffect(() => {
        if (isOpen && employeeId && companyId && month && year) {
            fetchEmployeeData();
        }
    }, [isOpen, employeeId, companyId, month, year]);

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            console.log('Fetching data for:', { employeeId, companyId, month, year });
            const response = await reportApi.getEmployeePayrollSummary(employeeId, companyId, month, year);
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
        doc.text(`Basic Salary: RS ${employeeData.basicSalary.toLocaleString()}`, 120, yPos);
        yPos += 7;

        doc.text(`Joined Date: ${employeeData.joinedDate}`, 14, yPos);
        yPos += 10;

        // Monthly Breakdown Table
        const tableData = employeeData.monthlyBreakdown.map(row => [
            row.month,
            row.workedDays.toString(),
            `RS ${row.basicPay.toLocaleString()}`,
            `RS ${row.otAmount.toLocaleString()} (${row.otHours}h)`,
            `RS ${row.grossPay.toLocaleString()}`,
            `RS ${row.netPay.toLocaleString()}`,
            `RS ${row.tax.toLocaleString()}`,
            `RS ${row.salaryAdvance.toLocaleString()}`,
            `RS ${row.deductions.toLocaleString()}`,
            `RS ${row.employeeEPF.toLocaleString()}`,
            `RS ${row.companyEPFETF.toLocaleString()}`
        ]);

        // Add totals row
        tableData.push([
            'SELECTED MONTH TOTALS',
            employeeData.annualTotals.workedDays.toString(),
            `RS ${employeeData.annualTotals.basicPay.toLocaleString()}`,
            `RS ${employeeData.annualTotals.otAmount.toLocaleString()}`,
            `RS ${employeeData.annualTotals.grossPay.toLocaleString()}`,
            `RS ${employeeData.annualTotals.netPay.toLocaleString()}`,
            `RS ${employeeData.annualTotals.tax.toLocaleString()}`,
            `RS ${employeeData.annualTotals.salaryAdvance.toLocaleString()}`,
            `RS ${employeeData.annualTotals.deductions.toLocaleString()}`,
            `RS ${employeeData.annualTotals.employeeEPF.toLocaleString()}`,
            `RS ${employeeData.annualTotals.companyEPFETF.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Month', 'Days', 'Basic', 'OT', 'Gross', 'Net', 'Tax', 'Advance', 'Total Ded.', 'EPF 8%', 'EPF/ETF Comp']],
            body: tableData,
            styles: { fontSize: 7 },
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
            ['Position:', employeeData.designation, '', 'Basic Salary:', `RS ${employeeData.basicSalary.toLocaleString()}`],
            ['Joined Date:', employeeData.joinedDate],
            [],
            ['Monthly Breakdown'],
            ['Month', 'Days', 'Basic', 'OT', 'Gross', 'Net', 'Tax', 'Advance', 'Total Ded.', 'EPF 8%', 'EPF/ETF Comp'],
            ...employeeData.monthlyBreakdown.map(row => [
                row.month,
                row.workedDays,
                row.basicPay,
                row.otAmount,
                row.grossPay,
                row.netPay,
                row.tax,
                row.salaryAdvance,
                row.deductions,
                row.employeeEPF,
                row.companyEPFETF
            ]),
            [
                'TOTALS',
                employeeData.annualTotals.workedDays,
                employeeData.annualTotals.basicPay,
                employeeData.annualTotals.otAmount,
                employeeData.annualTotals.grossPay,
                employeeData.annualTotals.netPay,
                employeeData.annualTotals.deductions - employeeData.annualTotals.employeeEPF, // Tax approx
                '',
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
            ['Position:', employeeData.designation, '', 'Basic Salary:', `RS ${employeeData.basicSalary.toLocaleString()}`],
            ['Joined Date:', employeeData.joinedDate],
            [],
            ['Monthly Breakdown'],
            ['Month', 'Days', 'Basic', 'OT', 'Gross', 'Net', 'Tax', 'Advance', 'Total Ded.', 'EPF 8%', 'EPF/ETF Comp'],
            ...employeeData.monthlyBreakdown.map(row => [
                row.month,
                row.workedDays,
                row.basicPay,
                row.otAmount,
                row.grossPay,
                row.netPay,
                row.tax,
                row.salaryAdvance,
                row.deductions,
                row.employeeEPF,
                row.companyEPFETF
            ]),
            [
                'TOTALS',
                employeeData.annualTotals.workedDays,
                '',
                '',
                employeeData.annualTotals.grossPay,
                employeeData.annualTotals.netPay,
                employeeData.annualTotals.deductions - employeeData.annualTotals.employeeEPF, // Tax approx
                '',
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
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : employeeData ? (
                            <>
                                {/* Employee Information */}
                                <div className="bg-gray-50 rounded-lg p-1 mb-3">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Employee Name:</span>
                                            <span className="text-base font-medium text-gray-900">{employeeData.employeeName}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Employee ID:</span>
                                            <span className="text-base font-medium text-gray-900">{employeeData.employeeCode}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Position:</span>
                                            <span className="text-base font-medium text-gray-900">{employeeData.designation}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Basic Salary:</span>
                                            <span className="text-base font-medium text-gray-900">
                                                RS: {employeeData.basicSalary.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">Joined Date:</span>
                                            <span className="text-base font-medium text-gray-900">{employeeData.joinedDate}</span>
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
                                                        <th className="px-4 py-3 text-center w-10"></th>
                                                        <th className="px-4 py-3 text-left font-semibold">Month</th>
                                                        <th className="px-4 py-3 text-center font-semibold">Days</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Basic</th>
                                                        <th className="px-4 py-3 text-right font-semibold">OT</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Gross</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Net</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Tax</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Advance</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Total Ded.</th>
                                                        <th className="px-4 py-3 text-right font-semibold">EPF 8%</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {employeeData.monthlyBreakdown.map((row, index) => (
                                                        <React.Fragment key={index}>
                                                            <tr className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer" onClick={() => toggleMonth(row.month)}>
                                                                <td className="px-4 py-3 text-center">
                                                                    {expandedMonths[row.month] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-gray-900">{row.month}</td>
                                                                <td className="px-4 py-3 text-center text-gray-700">{row.workedDays}</td>
                                                                <td className="px-4 py-3 text-right text-gray-900 font-medium">RS: {row.basicPay.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-green-600 font-medium">RS: {row.otAmount.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-gray-900 font-bold">RS: {row.grossPay.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-blue-600 font-bold">RS: {row.netPay.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-red-600">RS: {row.tax.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-red-600">RS: {row.salaryAdvance.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-red-700 font-medium">RS: {row.deductions.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right text-gray-900">RS: {row.employeeEPF.toLocaleString()}</td>
                                                            </tr>
                                                            {expandedMonths[row.month] && (
                                                                <tr className="bg-blue-50/30 border-b border-gray-100">
                                                                    <td colSpan={11} className="px-8 py-4">
                                                                        <div className="grid grid-cols-2 gap-8">
                                                                            <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                                                                                <h4 className="text-xs font-bold text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                                                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Allowances
                                                                                </h4>
                                                                                {row.allowances && row.allowances.length > 0 ? (
                                                                                    <div className="space-y-2">
                                                                                        {row.allowances.map((a, i) => (
                                                                                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                                                                                <span className="text-gray-600">{a.type}</span>
                                                                                                <span className="font-semibold text-gray-900">RS: {a.amount.toLocaleString()}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-sm text-gray-500 italic">No custom allowances</div>
                                                                                )}
                                                                            </div>
                                                                            <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                                                                                <h4 className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                                                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Deductions
                                                                                </h4>
                                                                                {row.customDeductions && row.customDeductions.length > 0 ? (
                                                                                    <div className="space-y-2">
                                                                                        {row.customDeductions.map((d, i) => (
                                                                                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                                                                                <span className="text-gray-600">{d.type}</span>
                                                                                                <span className="font-semibold text-gray-900">RS: {d.amount.toLocaleString()}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-sm text-gray-500 italic">No custom deductions</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                                {/* Annual Totals Footer */}
                                                <tfoot className="bg-blue-600 text-white font-bold">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-3 text-left">SELECTED MONTH TOTALS</td>
                                                        <td className="px-4 py-3 text-center">{employeeData.annualTotals.workedDays}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.basicPay.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.otAmount.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.grossPay.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.netPay.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.tax.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.salaryAdvance.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.deductions.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">RS: {employeeData.annualTotals.employeeEPF.toLocaleString()}</td>
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
