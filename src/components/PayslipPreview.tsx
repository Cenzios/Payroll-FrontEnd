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

const Divider = () => (
    <div className="text-[11px] text-gray-400 my-1 select-none overflow-hidden whitespace-nowrap">
        {"------------------------------------------------------------"}
    </div>
);

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
                <h3 className="text-lg font-semibold text-gray-600">No Payslip Generated</h3>
                <p className="max-w-xs mt-2 text-sm">
                    Select an employee from the left and click "Generate Pay Slip" to preview.
                </p>
            </div>
        );
    }

    const grossEarnings =
        previewPayslip.basicPay +
        previewPayslip.otAmount +
        (previewPayslip.allowances || []).reduce((sum: number, a: any) => sum + a.amount, 0);

    const totalDeductions =
        (previewPayslip.isEpfEnabled ? previewPayslip.epf8 : 0) +
        previewPayslip.deductions.reduce((sum: number, d: any) => sum + d.amount, 0);

    const monthLabel = new Date(selectedYear, selectedMonth).toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex flex-col">
                {/* Payslip Paper */}
                <div className="px-4 pt-3 pb-2 font-mono text-sm">
                    <div className="bg-white mx-auto max-w-lg">

                        {/* Top divider */}
                        <Divider />

                        {/* Company Header */}
                        <div className="text-center pl-1 mb-0.5">
                            <p className="font-bold text-[12px] uppercase">{companyName}</p>
                            <p className="font-bold text-[12px] uppercase">
                                PAY SLIP – MONTH OF: {monthLabel.toUpperCase()}
                            </p>
                        </div>

                        <Divider />

                        {/* Employee Details */}
                        <div className="space-y-0.5 pl-1 mt-1 mb-1">
                            <div className="flex text-[12px]">
                                <span className="w-36">Employee Name</span>
                                <span>: {selectedEmployee.fullName}</span>
                            </div>
                            <div className="flex text-[12px]">
                                <span className="w-36">Employee No</span>
                                <span>: {selectedEmployee.employeeId}</span>
                            </div>
                            <div className="flex text-[12px]">
                                <span className="w-36">Designation</span>
                                <span>: {selectedEmployee.designation}</span>
                            </div>
                        </div>

                        <Divider />

                        {/* EARNINGS heading */}
                        <div className="text-center font-bold text-[12px] uppercase my-0.5">
                            EARNINGS
                        </div>

                        <Divider />

                        {/* Earnings table header */}
                        <div className="flex text-[12px] pl-1 mb-0.5">
                            <span className="w-56">Description</span>
                            <span>Amount (Rs.)</span>
                        </div>

                        <Divider />

                        {/* Earnings rows */}
                        <div className="space-y-0.5 pl-1 mb-1">
                            {/* Basic salary label */}
                            <div className="flex text-[12px]">
                                <span className="w-56">
                                    {previewPayslip.salaryType === "MONTHLY" ? "Monthly Basic Salary" : "Daily Basic Salary"}
                                </span>
                                <span>: {previewPayslip.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            {/* Allowances */}
                            {previewPayslip.allowances?.map((a: any, i: number) => (
                                <div key={i} className="flex text-[12px]">
                                    <span className="w-56">{a.name}</span>
                                    <span>: {a.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            ))}

                            {/* Working days */}
                            <div className="flex text-[12px]">
                                <span className="w-56">Working days for the month</span>
                                <span>:  {companyWorkingDays}</span>
                            </div>

                            {/* Worked days */}
                            <div className="flex text-[12px]">
                                <span className="w-56">Worked Days</span>
                                <span>:  {previewPayslip.workedDays ?? previewPayslip.workingDays}</span>
                            </div>

                            {/* Paid Leave */}
                            {previewPayslip.salaryType === "MONTHLY" && (previewPayslip.paidLeave || 0) > 0 && (
                                <div className="flex text-[12px]">
                                    <span className="w-56">Paid Leave</span>
                                    <span>:  {previewPayslip.paidLeave}</span>
                                </div>
                            )}



                            {/* Basic pay calculation */}
                            {previewPayslip.salaryType === "DAILY" && (
                                <div className="flex text-[12px]">
                                    <span className="w-56">
                                        Basic Salary ({previewPayslip.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {previewPayslip.workedDays ?? previewPayslip.workingDays})
                                    </span>
                                    <span>:  {previewPayslip.basicPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            {/* OT if any */}
                            {previewPayslip.otAmount > 0 && (
                                <div className="flex text-[12px]">
                                    <span className="w-56">OT ({previewPayslip.otHours} hrs)</span>
                                    <span>:  {previewPayslip.otAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        {/* Gross Earnings */}
                        <div className="flex text-[12px] pl-1 mb-0.5">
                            <span className="w-56">Gross Earnings</span>
                            <span>: <strong>{grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                        </div>

                        <Divider />

                        {/* DEDUCTIONS heading */}
                        <div className="text-center font-bold text-[12px] uppercase my-0.5">
                            DEDUCTIONS
                        </div>

                        <Divider />

                        {/* Deductions table header */}
                        <div className="flex text-[12px] pl-1 mb-0.5">
                            <span className="w-56">Description</span>
                            <span>Amount (Rs.)</span>
                        </div>

                        <Divider />

                        {/* Deductions rows */}
                        <div className="space-y-0.5 pl-1 mb-1">
                            {previewPayslip.isEpfEnabled && (
                                <div className="flex text-[12px]">
                                    <span className="w-56">EPF (8%)</span>
                                    <span>:  {previewPayslip.epf8.toFixed(2)}</span>
                                </div>
                            )}
                            {/* Deductions including Salary Advance & Loans */}
                            {previewPayslip.deductions?.filter((d: any) => d.amount > 0).map((d: any, i: number) => (
                                <div key={i} className="flex text-[12px]">
                                    <span className="w-56">{d.name}</span>
                                    <span>:  {d.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <Divider />

                        {/* Total Deductions */}
                        <div className="flex text-[12px] pl-1 mb-0.5">
                            <span className="w-56">Total Deductions</span>
                            <span>:  {totalDeductions.toFixed(2)}</span>
                        </div>

                        <Divider />

                        {/* NET SALARY heading */}
                        <div className="text-center font-bold text-[12px] uppercase my-0.5">
                            NET SALARY
                        </div>

                        <Divider />

                        {/* Net Salary Payable */}
                        <div className="flex text-[12px] pl-1 mb-0.5">
                            <span className="w-56">Net Salary Payable (Rs)</span>
                            <span>: <strong>{previewPayslip.netSalary.toLocaleString()}</strong></span>
                        </div>

                        <Divider />

                        {/* Employer Contributions (if EPF enabled) */}
                        {previewPayslip.isEpfEnabled && (
                            <>
                                <div className="text-center font-bold text-[12px] uppercase my-0.5">
                                    EMPLOYER CONTRIBUTIONS
                                </div>
                                <Divider />
                                <div className="space-y-0.5 pl-1 mb-0.5">
                                    <div className="flex text-[12px]">
                                        <span className="w-56">EPF (12%)</span>
                                        <span>:  {previewPayslip.epf12.toFixed(2)}</span>
                                    </div>
                                    <div className="flex text-[12px]">
                                        <span className="w-56">ETF (3%)</span>
                                        <span>:  {previewPayslip.etf3.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Divider />
                            </>
                        )}



                        {/* Footer */}
                        <div className="text-center text-[11px] text-gray-500 my-0.5">
                            {/* Powered by {companyName} */}
                            Powered by Cenzios (PVT) LTD
                        </div>

                        <Divider />
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
    );
};

export default PayslipPreview;