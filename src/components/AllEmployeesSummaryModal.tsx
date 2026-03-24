import { useState, useEffect } from 'react';
import { X, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import Toast from './Toast';
import { exportAllEmployeesSummary } from '../utils/exportService';

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
    workingDays: number;
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
        basicPay: number;
        otAmount: number;
        grossPay: number;
        salaryAdvance: number;
        deductions: number;
        netPay: number;
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
        exportAllEmployeesSummary('pdf', summaryData);
        setToast({ message: 'PDF exported successfully', type: 'success' });
    };

    const exportExcel = () => {
        if (!summaryData) return;
        exportAllEmployeesSummary('excel', summaryData);
        setToast({ message: 'Excel exported successfully', type: 'success' });
    };

    const exportCSV = () => {
        if (!summaryData) return;
        exportAllEmployeesSummary('csv', summaryData);
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
                                                        <th className="px-3 py-3 text-left font-medium border-x border-gray-700">Emp ID</th>
                                                        <th className="px-3 py-3 text-left font-medium border-x border-gray-700">Name</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Days</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Basic</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">OT</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Gross</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Advance</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Total Ded.</th>
                                                        <th className="px-3 py-3 text-center font-medium border-x border-gray-700">Net Pay</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {summaryData.employees.map((emp, index) => (
                                                        <tr key={index} className="hover:bg-gray-50 bg-white border-b border-gray-100">
                                                            <td className="px-3 py-3 text-gray-900 border-x border-gray-200 text-center font-medium">{emp.employeeCode}</td>
                                                            <td className="px-3 py-3 text-gray-700 border-x border-gray-200">{emp.employeeName}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">{emp.workingDays}</td>
                                                            <td className="px-3 py-3 text-center text-gray-700 border-x border-gray-200">RS: {emp.basicPay.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-green-600 border-x border-gray-200 font-medium">RS: {emp.otAmount.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-gray-900 border-x border-gray-200 font-bold">RS: {emp.grossPay.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-red-600 border-x border-gray-200">RS: {emp.salaryAdvance.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-red-700 border-x border-gray-200 font-medium">RS: {emp.deductions.toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center text-blue-600 border-x border-gray-200 font-bold">RS: {emp.netPay.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-[#3b82f6] text-white">
                                                    <tr className="font-bold">
                                                        <td colSpan={3} className="px-3 py-3 uppercase">TOTAL AMOUNTS</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.basicPay.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.otAmount.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.grossPay.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.salaryAdvance.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.deductions.toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">RS: {summaryData.totals.netPay.toLocaleString()}</td>
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
