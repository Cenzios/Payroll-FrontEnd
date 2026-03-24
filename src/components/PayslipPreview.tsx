import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { Employee } from "../types/employee.types";

interface PayslipPreviewProps {
    previewPayslip: any;
    selectedEmployee: Employee | null;
    companyName: string;
    selectedYear: number;
    selectedMonth: number;
    companyWorkingDays: number;
    exportPDF: () => void;
    exportExcel: () => void;
    exportCSV: () => void;
}

const PayslipPreview = ({
    previewPayslip,
    selectedEmployee,
    companyName,
    selectedYear,
    selectedMonth,
    companyWorkingDays,
    exportPDF,
    exportExcel,
    exportCSV,
}: PayslipPreviewProps) => {
    if (!previewPayslip || !selectedEmployee) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 items-center justify-center text-gray-400 p-8 text-center min-h-[400px]">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">
                    No Payslip Generated
                </h3>
                <p className="max-w-xs mt-2 text-sm">
                    Select an employee from the left and click "Generate Pay Slip" to
                    preview.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex flex-col">
                {/* Preview Container (No scroll) */}
                <div>
                    <div className="p-8 font-mono text-sm">
                        {/* Paper Effect Container */}
                        <div className="bg-white p-6 border-2 border-dashed border-gray-300 relative mx-auto max-w-lg shadow-sm">
                            {/* Header */}
                            <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                                <h2 className="text-lg font-bold uppercase tracking-wider">
                                    {companyName}
                                </h2>
                                <p className="text-xs font-semibold mt-1">
                                    Pay Slip -{" "}
                                    {new Date(selectedYear, selectedMonth).toLocaleString(
                                        "default",
                                        {
                                            month: "long",
                                            year: "numeric",
                                        },
                                    )}
                                </p>
                            </div>

                            {/* Emp Details */}
                            <div className="mb-6 text-xs space-y-1">
                                <div className="flex">
                                    <span className="w-24 font-bold">Employee Name</span>{" "}
                                    <span>: {selectedEmployee.fullName}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Employee No</span>{" "}
                                    <span>: {selectedEmployee.employeeId}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Designation</span>{" "}
                                    <span>: {selectedEmployee.designation}</span>
                                </div>
                            </div>

                            {/* Earnings */}
                            <div className="mb-6">
                                <div className="border-b border-gray-800 font-bold mb-2 pb-1">
                                    EARNINGS
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span>
                                        {previewPayslip.salaryType === "MONTHLY"
                                            ? "Monthly Rate"
                                            : "Daily Rate"}
                                    </span>
                                    <span>Rs. {previewPayslip.basicSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span>Working Days</span>
                                    <span>{companyWorkingDays}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span>Worked Days</span>
                                    <span>{previewPayslip.workedDays}</span>
                                </div>
                                <div className="flex justify-between mb-1 font-semibold text-gray-800">
                                    <span>Calculated Basic Pay</span>
                                    <span>Rs. {previewPayslip.basicPay.toLocaleString()}</span>
                                </div>
                                {previewPayslip.otAmount > 0 && (
                                    <div className="flex justify-between mb-1 font-semibold text-gray-800">
                                        <span>OT ({previewPayslip.otHours} hrs)</span>
                                        <span>Rs. {previewPayslip.otAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {previewPayslip.allowances?.map((a: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex justify-between mb-1 text-green-700 font-medium"
                                    >
                                        <span>+ {a.name}</span>
                                        <span>Rs. {a.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between mt-2 pt-2 border-t border-gray-300 font-bold text-gray-900">
                                    <span>Gross Earnings</span>
                                    <span>
                                        Rs.{" "}
                                        {(
                                            previewPayslip.basicPay +
                                            previewPayslip.otAmount +
                                            (previewPayslip.allowances || []).reduce(
                                                (sum: number, a: any) => sum + a.amount,
                                                0,
                                            )
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Deductions
                                </h4>
                                <div className="space-y-1">
                                    {previewPayslip.isEpfEnabled && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">EPF (8%)</span>
                                            <span className="font-medium text-red-600">
                                                -Rs {previewPayslip.epf8.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {previewPayslip.deductions.map((d: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{d.name}</span>
                                            <span className="font-medium text-red-600">
                                                -Rs {d.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-100 mt-1">
                                        <span className="text-gray-800">Total Deductions</span>
                                        <span className="text-red-600">
                                            -Rs{" "}
                                            {(
                                                (previewPayslip.isEpfEnabled ? previewPayslip.epf8 : 0) +
                                                previewPayslip.deductions.reduce(
                                                    (sum: any, d: any) => sum + d.amount,
                                                    0,
                                                )
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Salary */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold text-gray-900">
                                        Net Salary
                                    </span>
                                    <span className="text-xl font-bold text-blue-600">
                                        Rs {previewPayslip.netSalary.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Employer Contributions */}
                            {previewPayslip.isEpfEnabled && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Employer Contributions
                                    </h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">EPF (12%)</span>
                                            <span className="font-medium text-gray-900">
                                                Rs {previewPayslip.epf12.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">ETF (3%)</span>
                                            <span className="font-medium text-gray-900">
                                                Rs {previewPayslip.etf3.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Signatures */}
                            <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-[10px] text-gray-500">
                                <div>Prepared By : __________________</div>
                                <div>Checked By : _______________</div>
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] text-gray-500">
                                <div>Employee Sign : ________________</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 mx-4 mb-4 rounded-lg">
                        <button
                            onClick={exportPDF}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <FileText className="w-4 h-4" /> Download Pay Slip (PDF)
                        </button>
                        <button
                            onClick={exportExcel}
                            className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors font-medium shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Download Pay Slip (Excel)
                        </button>
                        <button
                            onClick={exportCSV}
                            className="w-full bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors font-medium shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Download Pay Slip (CSV)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayslipPreview;
