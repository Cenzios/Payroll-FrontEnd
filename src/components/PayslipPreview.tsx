import { useState, useRef } from "react";
import { FileText, FileSpreadsheet, Download, ArrowBigDownIcon, ArrowDownIcon } from "lucide-react";
import PortalDropdown from "./PortalDropdown";
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);

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

    const fmt = (val: number) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
            {/* Header */}
            <div className="text-center mt-3">
                <h1 className="text-sm font-bold text-[#1D1F24]">{companyName}</h1>
                <p className="text-xs font-bold text-[#718096] tracking-[0.15em] mt-1 mb-5 uppercase">
                    PAY SLIP • {monthLabel}
                </p>
            </div>

            {/* Employee Profile Box */}
            <div className="bg-[#F4F4EE] p-3 flex items-center gap-5 pl-5 mb-3">
                <div className="w-7 h-7 bg-[#F0F9FF] rounded-lg flex items-center justify-center text-[#407BFF] font-bold text-sm shadow-sm border border-[#E0F2FE]">
                    {selectedEmployee.fullName.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xs font-bold text-[#1D1F24]">{selectedEmployee.fullName}</h2>
                    <div className="flex items-center gap-2 text-sm text-[#718096] font-light">
                        <span>{selectedEmployee.employeeId}</span>
                        <span className="w-1 h-1 bg-[#718096] rounded-full"></span>
                        <span>{selectedEmployee.designation || "Designation —"}</span>
                    </div>
                </div>
            </div>


            {/* Sections Container */}
            <div className="px-6">
                {/* EARNINGS */}
                <div className="mb-4">
                    <h3 className="text-[10px] font-bold text-[#718096] tracking-widest uppercase mb-4 flex items-center gap-3">
                        EARNINGS
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[#718096]">
                                {previewPayslip.salaryType === "MONTHLY" ? "Monthly basic salary" : "Daily basic salary"}
                            </span>
                            <span className="text-[#1D1F24] font-bold tracking-tight">{fmt(previewPayslip.basicSalary)}</span>
                        </div>

                        {previewPayslip.allowances?.map((a: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096]">{a.name}</span>
                                <span className="text-[#1D1F24] font-bold tracking-tight">{fmt(a.amount)}</span>
                            </div>
                        ))}

                        <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[#718096]">Working days in month</span>
                            <span className="text-[#1D1F24] font-bold tracking-tight">{companyWorkingDays}</span>
                        </div>

                        <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[#718096]">Worked days</span>
                            <span className="text-[#1D1F24] font-bold tracking-tight">{previewPayslip.workedDays ?? previewPayslip.workingDays}</span>
                        </div>

                        {previewPayslip.salaryType === "MONTHLY" && (previewPayslip.paidLeave || 0) > 0 && (
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096]">Paid Leave</span>
                                <span className="text-[#1D1F24] font-bold tracking-tight">{previewPayslip.paidLeave}</span>
                            </div>
                        )}

                        {previewPayslip.salaryType === "DAILY" && (
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096] italic">
                                    Basic Calculation ({fmt(previewPayslip.basicSalary)} × {previewPayslip.workedDays ?? previewPayslip.workingDays})
                                </span>
                                <span className="text-[#1D1F24] font-bold tracking-tight">{fmt(previewPayslip.basicPay)}</span>
                            </div>
                        )}

                        {previewPayslip.otAmount > 0 && (
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096]">OT ({previewPayslip.otHours} hrs)</span>
                                <span className="text-[#1D1F24] font-bold tracking-tight">{fmt(previewPayslip.otAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100">
                        <span className="text-[13px] font-bold text-[#1D1F24]">Gross earnings</span>
                        <span className="text-[13px] font-bold text-[#22A103]">{fmt(grossEarnings)}</span>
                    </div>
                </div>

                {/* DEDUCTIONS */}
                <div className="mb-4">
                    <h3 className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-4 mt-6">
                        DEDUCTIONS
                    </h3>
                    <div className="space-y-2">
                        {previewPayslip.isEpfEnabled && (
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096]">EPF (8%)</span>
                                <span className="text-[#E11D48] font-bold tracking-tight">{fmt(previewPayslip.epf8)}</span>
                            </div>
                        )}
                        {previewPayslip.deductions?.filter((d: any) => d.amount > 0).map((d: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-[12px]">
                                <span className="text-[#718096]">{d.name}</span>
                                <span className="text-[#E11D48] font-bold tracking-tight">{fmt(d.amount)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100">
                        <span className="text-[13px] font-bold text-[#1D1F24]">Total deductions</span>
                        <span className="text-[13px] font-bold text-[#E11D48]">{totalDeductions.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* NET SALARY PAYABLE BOX */}
            <div className="bg-[#EBF8FF] p-4 border border-[#0000000A]">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-[#407BFF] tracking-widest uppercase mb-1">NET SALARY PAYABLE</p>
                        <h2 className="text-[16px] font-bold text-[#407BFF] tracking-tight">Rs. {previewPayslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">GROSS</p>
                            <p className="text-[10px] font-bold text-[#407BFF] tracking-tight">{fmt(grossEarnings)}</p>
                        </div>
                        <div className="h-10 w-px bg-gray-200"></div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">DEDUCTIONS</p>
                            <p className="text-[10px] font-bold text-[#E11D48] tracking-tight">{fmt(totalDeductions)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* EMPLOYER CONTRIBUTIONS */}
            {previewPayslip.isEpfEnabled && (
                <div className="bg-[#FDFBF7] px-6 py-4 flex items-center justify-between mb-6 border border-[#0000000A]">
                    <p className="text-[8px] font-bold text-[#1D1F24] tracking-widest uppercase">EMPLOYER CONTRIBUTIONS</p>
                    <div className="flex gap-8">
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] text-[#718096] font-bold uppercase">EPF 12%</span>
                            <span className="text-[8px] font-bold text-[#1D1F24] tracking-tight">{fmt(previewPayslip.epf12)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] text-[#718096] font-bold uppercase">ETF 3%</span>
                            <span className="text-[8px] font-bold text-[#1D1F24] tracking-tight">{fmt(previewPayslip.etf3)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="flex items-center justify-between px-6 pb-2">
                <p className="text-[8px] tracking-wide">
                    Powered by Cenzios (PVT) LTD
                </p>

                <button
                    ref={downloadBtnRef}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#407BFF] text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all shadow-sm active:scale-95"
                >
                    <ArrowDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} /> Download
                </button>

                <PortalDropdown
                    anchorEl={downloadBtnRef.current}
                    open={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                >
                    <div className="flex flex-col">
                        <button
                            onClick={() => {
                                exportPDF();
                                setIsDropdownOpen(false);
                            }}
                            className="flex items-center justify-center py-2.5 text-[13px] font-medium text-blue-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors group"
                        >
                            <span>PDF</span>
                        </button>
                        <button
                            onClick={() => {
                                exportExcel();
                                setIsDropdownOpen(false);
                            }}
                            className="flex items-center justify-center py-2.5 text-[13px] font-medium text-green-500 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors group"
                        >
                            <span>Excel</span>
                        </button>
                        <button
                            onClick={() => {
                                exportCSV();
                                setIsDropdownOpen(false);
                            }}
                            className="flex items-center justify-center py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors group"
                        >
                            <span>CSV</span>
                        </button>
                    </div>
                </PortalDropdown>
            </footer>

        </div>
    );
};

export default PayslipPreview;