import React, { useState } from "react";
import { Loader2, SlidersHorizontal, Wallet, MinusCircle, Lock } from "lucide-react";
import { Employee } from "../types/employee.types";

interface EmployeeSalaryCardProps {
    emp: Employee;
    selectedEmployee: Employee | null;
    handleSelectEmployee: (emp: Employee) => void;
    workedDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    otHours: number;
    salaryAdvance: number;
    loanDeduction: number;
    handleEmployeeWorkedDaysChange: (empId: string, val: number) => void;
    handleEmployeeOtHoursChange: (empId: string, val: number) => void;
    handleEmployeeSalaryAdvanceChange: (empId: string, val: number) => void;
    handleToggleLoan: (empId: string) => void;
    handleToggleEpfEtf: (empId: string) => void;
    handleGeneratePayslip: (emp: Employee) => void;
    openManageModal: (type: "allowance" | "deduction", emp: Employee) => void;
    allowanceToggles: Record<string, boolean>;
    deductionToggles: Record<string, boolean>;
    setAllowanceToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setDeductionToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isSaving: boolean;
    hasAnyError: (emp: Employee) => boolean;
    setTouchedFields: React.Dispatch<React.SetStateAction<any>>;
}

const fmt = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EmployeeSalaryCard = ({
    emp,
    selectedEmployee,
    handleSelectEmployee,
    workedDays,
    isEpfEnabled,
    isLoanEnabled,
    otHours,
    salaryAdvance,
    loanDeduction,
    handleEmployeeWorkedDaysChange,
    handleEmployeeOtHoursChange,
    handleEmployeeSalaryAdvanceChange,
    handleToggleLoan,
    handleToggleEpfEtf,
    handleGeneratePayslip,
    openManageModal,
    allowanceToggles,
    deductionToggles,
    setAllowanceToggles,
    setDeductionToggles,
    isSaving,
    hasAnyError,
    setTouchedFields,
}: EmployeeSalaryCardProps) => {
    const isSelected = selectedEmployee?.id === emp.id;
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Derived calculations
    const basicSalary = emp.basicSalary || 0;
    const otRate = emp.otRate || 0;
    const otAmount = otHours * otRate;

    // Calculate actual allowance/deduction totals from employee data
    const totalAllowances = (emp.recurringAllowances || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions_custom = (emp.recurringDeductions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const basicPay = emp.salaryType === "MONTHLY"
        ? basicSalary // shown as monthly pay
        : basicSalary * workedDays;

    const epfAmount = isEpfEnabled ? basicPay * 0.08 : 0;

    const totalEarnings = basicPay + otAmount + totalAllowances;
    const totalDeductions = salaryAdvance + epfAmount + (isLoanEnabled ? loanDeduction : 0) + totalDeductions_custom;
    const netSalary = totalEarnings - totalDeductions;

    return (
        <div
            onClick={() => handleSelectEmployee(emp)}
            className={`bg-white rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${isSelected
                ? "border-blue-400 shadow-lg ring-1 ring-blue-300"
                : "border-gray-200 hover:border-blue-200 hover:shadow-md"
                }`}
        >
            {/* ── TOP HEADER ── */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
                {/* Employee Info */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-base shrink-0">
                        {emp.fullName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{emp.fullName}</h3>
                        <p className="text-[12px] font-semibold text-blue-500 leading-tight">{emp.employeeId}</p>
                        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{emp.designation}</p>
                    </div>
                </div>

                {/* Middle Info */}
                <div className="hidden sm:flex flex-col gap-1 border-l border-gray-200 pl-5 ml-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-24">Salary Mode:</span>
                        <span className="text-[12px]  text-gray-800">{emp.salaryType === "MONTHLY" ? "Monthly" : "Daily"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-24">{emp.salaryType === "MONTHLY" ? "Monthly pay" : "Daily Rate"}</span>
                        <span className="text-[12px]  text-gray-800">{fmt(basicSalary)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-24">OT Rate</span>
                        <span className="text-[12px]  text-gray-800">{fmt(otRate)}</span>
                    </div>
                </div>

                {/* Right: Allowance & Deduction Summary */}
                <div className="hidden lg:flex flex-col gap-2 border-l border-gray-100 pl-5 ml-2">
                    <div className="flex items-center justify-between gap-6">
                        <div>
                            <span className="text-[11px] text-gray-400 block">Total Allowances</span>
                            <span className="text-[13px]  text-gray-800">{fmt(totalAllowances)}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); openManageModal("allowance", emp); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]  text-blue-500 border border-blue-200/60 bg-blue-50/40 backdrop-blur-sm hover:bg-blue-100/60 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Manage
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <div>
                            <span className="text-[11px] text-gray-400 block">Total Deduction</span>
                            <span className="text-[13px]  text-gray-800">{fmt(totalDeductions_custom)}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); openManageModal("deduction", emp); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]  text-blue-500 border border-blue-200/60 bg-blue-50/40 backdrop-blur-sm hover:bg-blue-100/60 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Manage
                        </button>
                    </div>
                </div>
            </div>

            {/* ── EXPANDED BODY (selected only) ── */}
            {isSelected && (
                <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-1 duration-200">

                    {/* TWO COLUMN: Earnings | Deductions */}
                    <div className="grid grid-cols-2 divide-x divide-gray-200">

                        {/* ── LEFT: EARNINGS ── */}
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Wallet className="w-4 h-4 text-green-600" />
                                <h4 className="text-[11px] font-extrabold tracking-widest text-green-600 uppercase">
                                    Earnings
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {/* Worked Days */}
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[13px] text-gray-600 whitespace-nowrap">Worked Days</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={workedDays}
                                        onChange={(e) => handleEmployeeWorkedDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                        onBlur={() => setTouchedFields((prev: any) => ({ ...prev, employeeDays: { ...prev.employeeDays, [emp.id]: true } }))}
                                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px]  text-gray-800 text-right focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none no-spinner"
                                        min="0" max="31"
                                    />
                                </div>

                                {/* OT Hours */}
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[13px] text-gray-600 whitespace-nowrap">OT Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={otHours}
                                        onChange={(e) => handleEmployeeOtHoursChange(emp.id, parseFloat(e.target.value) || 0)}
                                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px]  text-gray-800 text-right focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none no-spinner"
                                        min="0"
                                    />
                                </div>

                                {/* OT Amount (read-only) */}
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[13px] text-gray-600 whitespace-nowrap">OT Amount</label>
                                    <div className="w-28 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[13px] font-bold text-blue-600 text-right">
                                        {fmt(otAmount)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: DEDUCTIONS ── */}
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-2 mb-4">
                                <MinusCircle className="w-4 h-4 text-red-500" />
                                <h4 className="text-[11px] font-extrabold tracking-widest text-red-500 uppercase">
                                    Deductions
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {/* Advance */}
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-[13px] text-gray-600 whitespace-nowrap">Advance</label>
                                    <input
                                        type="number"
                                        value={salaryAdvance}
                                        onChange={(e) => handleEmployeeSalaryAdvanceChange(emp.id, parseFloat(e.target.value) || 0)}
                                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px]  text-gray-800 text-right focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none no-spinner"
                                        min="0"
                                    />
                                </div>

                                {/* EPF Contribution */}
                                <div className="flex items-center justify-between gap-3">

                                    {/* LEFT SIDE: Label + Toggle */}
                                    <div className="flex items-center justify-between w-full max-w-[220px]">
                                        <label className="text-[13px] text-gray-600">
                                            EPF Contribution
                                        </label>

                                        <button
                                            onClick={() => handleToggleEpfEtf(emp.id)}
                                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${isEpfEnabled ? "bg-blue-500" : "bg-gray-300"}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isEpfEnabled ? "translate-x-5" : "translate-x-1"}`}
                                            />
                                        </button>
                                    </div>

                                    {/* RIGHT SIDE: Amount (UNCHANGED) */}
                                    <div className={`w-28 px-3 py-1.5 border rounded-lg text-[13px] text-right transition-opacity ${isEpfEnabled ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-300 opacity-50"}`}>
                                        {fmt(isEpfEnabled ? epfAmount : 0)}
                                    </div>
                                </div>


                                {/* Loan */}
                                <div className="flex items-center justify-between gap-3">

                                    {/* LEFT SIDE: Label + Toggle */}
                                    <div className="flex items-center justify-between w-full max-w-[220px]">
                                        <label className="text-[13px] text-gray-600">
                                            Loan
                                        </label>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleLoan(emp.id); }}
                                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${isLoanEnabled ? "bg-blue-500" : "bg-gray-300"}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isLoanEnabled ? "translate-x-5" : "translate-x-1"}`}
                                            />
                                        </button>
                                    </div>

                                    {/* RIGHT SIDE: Amount (UNCHANGED) */}
                                    <div className={`w-28 px-3 py-1.5 border rounded-lg text-[13px] text-right transition-opacity ${isLoanEnabled ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-300 opacity-50 line-through"}`}>
                                        {fmt(isLoanEnabled ? loanDeduction : 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TOTALS BAR ── */}
                    <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50">
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Total Earnings</span>
                            <span className="text-[18px] font-extrabold text-green-500">{fmt(totalEarnings)}</span>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Total Deduction</span>
                            <span className="text-[18px] font-extrabold text-red-500">{fmt(totalDeductions)}</span>
                        </div>
                    </div>

                    {/* ── NET SALARY + ACTIONS ── */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Net Salary</span>
                            <span className="text-[22px] font-extrabold text-blue-600">{fmt(netSalary)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Generate Pay-slip */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp); }}
                                disabled={isSaving || hasAnyError(emp)}
                                className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 ${isSaving || hasAnyError(emp)
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[#4584ff] text-white hover:bg-[#3b73e6] shadow-sm hover:shadow-md active:scale-95"
                                    }`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Pay-slip"}
                            </button>

                            {/* Confirm Pay-slip */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsConfirmModalOpen(true); }}
                                disabled={isSaving || hasAnyError(emp)}
                                className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${isSaving || hasAnyError(emp)
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[#28aa58] text-white hover:bg-[#23964e] shadow-sm hover:shadow-md active:scale-95"
                                    }`}
                            >
                                Confirm Pay-slip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapsed hint */}
            {!isSelected && (
                <div className="px-5 pb-3 text-[12px] text-gray-400 italic">
                    Click to calculate salary
                </div>
            )}

            {/* Confirm Modal Overlay */}
            {isConfirmModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-[24px] p-6 w-full max-w-[480px] shadow-2xl animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-[#e6f5ea] border border-[#d3ecd8] flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-[#2ca653]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[17px] font-bold text-gray-900 leading-tight">Confirm & Lock Payslip</h3>
                                <p className="text-[13px] text-gray-500 mt-1">Once locked, the pay-slip cannot be edited.</p>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-[#f4f7fe] border border-[#d6e2fa] rounded-2xl p-4 mb-5 space-y-3">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-gray-700">Employee</span>
                                <span className="text-gray-900">{emp.fullName} ({emp.employeeId})</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-gray-700">Period</span>
                                <span className="text-gray-900">
                                    {emp.salaryType === "MONTHLY" ? "Monthly" : "Daily"} &ndash; {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-gray-700">Total Earnings</span>
                                <span className="text-[#2ca653] font-medium">{fmt(totalEarnings)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-gray-700">Total Deductions</span>
                                <span className="text-[#ef4444] font-medium">{fmt(totalDeductions)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[14px] pt-1.5 border-t border-[#d6e2fa]">
                                <span className="text-gray-800">Net Salary</span>
                                <span className="font-bold text-gray-900">{fmt(netSalary)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-[0.4] py-3 px-4 rounded-[14px] text-[14px] font-bold text-gray-900 bg-[#dbeafe] hover:bg-[#bfdbfe] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    /* TODO: implement confirm */
                                    setIsConfirmModalOpen(false);
                                }}
                                className="flex-[0.6] py-3 px-4 rounded-[14px] text-[14px] font-bold text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors shadow-sm"
                            >
                                Yes Confirm & Lock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeSalaryCard;