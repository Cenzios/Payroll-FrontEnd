import React, { useState } from "react";
import { Loader2, ChevronRight, Eye, Lock } from "lucide-react";
import { Employee } from "../types/employee.types";

interface EmployeeSalaryCardProps {
    emp: Employee;
    generatedSalary?: any;
    selectedEmployee: Employee | null;
    handleSelectEmployee: (emp: Employee) => void;
    workedDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    otHours: number;
    salaryAdvance: number;
    loanDeduction: number;
    companyWorkingDays: number;
    hasLoanInstallment: boolean;
    handleEmployeeWorkedDaysChange: (empId: string, val: number) => void;
    handleEmployeeOtHoursChange: (empId: string, val: number) => void;
    handleEmployeeSalaryAdvanceChange: (empId: string, val: number) => void;
    handleToggleLoan: (empId: string) => void;
    handleToggleEpfEtf: (empId: string) => void;
    handleGeneratePayslip: (emp: Employee) => void;
    handleConfirmPayslip: (emp: Employee) => void;
    openManageModal: (type: "allowance" | "deduction", emp: Employee) => void;
    salaryAllowances: Record<string, { type: string; amount: number }[]>;
    salaryDeductions: Record<string, { type: string; amount: number }[]>;
    isSaving: boolean;
    hasAnyError: (emp: Employee) => boolean;
    setTouchedFields: React.Dispatch<React.SetStateAction<any>>;
}

const fmt = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Toggle Switch component
const Toggle = ({
    enabled,
    onToggle,
    disabled,
}: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0
      ${enabled ? (disabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500") : "bg-gray-300"}
      ${disabled && !enabled ? "opacity-50 cursor-not-allowed" : ""}
    `}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
        ${enabled ? "translate-x-6" : "translate-x-1"}
      `}
        />
    </button>
);

const EmployeeSalaryCard = ({
    emp,
    generatedSalary,
    selectedEmployee,
    handleSelectEmployee,
    workedDays,
    isEpfEnabled,
    isLoanEnabled,
    otHours,
    salaryAdvance,
    loanDeduction,
    companyWorkingDays,
    hasLoanInstallment,
    handleEmployeeWorkedDaysChange,
    handleEmployeeOtHoursChange,
    handleEmployeeSalaryAdvanceChange,
    handleToggleLoan,
    handleToggleEpfEtf,
    handleGeneratePayslip,
    handleConfirmPayslip,
    openManageModal,
    salaryAllowances,
    salaryDeductions,
    isSaving,
    hasAnyError,
    setTouchedFields,
}: EmployeeSalaryCardProps) => {
    const isSelected = selectedEmployee?.id === emp.id;
    const isLocked = !!generatedSalary;
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Derived calculations
    const displayWorkedDays = isLocked ? generatedSalary.workingDays : workedDays;
    const displayOtHours = isLocked ? generatedSalary.otHours : otHours;
    const displaySalaryAdvance = isLocked ? generatedSalary.salaryAdvance : salaryAdvance;

    const basicSalary = emp.basicSalary || 0;
    const otRate = emp.otRate || 0;
    const otAmount = isLocked ? generatedSalary.otAmount : displayOtHours * otRate;

    const currentAllowances = salaryAllowances[emp.id] || emp.recurringAllowances || [];
    const totalAllowances = isLocked
        ? generatedSalary.allowanceTotal
        : currentAllowances.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const currentDeductions = salaryDeductions[emp.id] || emp.recurringDeductions || [];
    const totalDeductions_custom = isLocked
        ? generatedSalary.deductionTotal - (generatedSalary.loanDeduction || 0)
        : currentDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const basicPay = isLocked
        ? generatedSalary.basicPay
        : emp.salaryType === "MONTHLY"
            ? companyWorkingDays > 0
                ? (basicSalary / companyWorkingDays) * displayWorkedDays
                : 0
            : basicSalary * displayWorkedDays;

    const epfAmount = isLocked
        ? generatedSalary.employeeEPF
        : emp.epfEnabled && isEpfEnabled
            ? basicPay * 0.08
            : 0;

    const totalEarnings = isLocked
        ? generatedSalary.grossSalary
        : basicPay + (emp.otRate > 0 ? otAmount : 0) + totalAllowances;

    const totalDeductions = isLocked
        ? generatedSalary.totalDeduction
        : displaySalaryAdvance +
        epfAmount +
        (hasLoanInstallment && isLoanEnabled ? loanDeduction : 0) +
        totalDeductions_custom;

    const netSalary = isLocked ? generatedSalary.netSalary : totalEarnings - totalDeductions;

    // Current period label
    const periodLabel = new Date().toLocaleString("default", { month: "short", year: "numeric" });

    const inputClass = (locked: boolean) =>
        `w-full px-3 py-2 border rounded-xl text-[14px] text-right focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none no-spinner font-semibold
    ${locked
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-800 hover:border-blue-300"
        }`;

    return (
        <div
            onClick={() => handleSelectEmployee(emp)}
            className={`relative bg-[#f0f5ff] rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden
        ${isSelected
                    ? "border-blue-300 shadow-lg ring-1 ring-blue-200"
                    : "border-blue-100 hover:border-blue-200 hover:shadow-md"
                }`}
        >
            {/* Lock overlay — covers upper rows in both collapsed and expanded state, never covers bottom bar */}
            {isLocked && (
                <div className={`absolute inset-x-0 top-0 z-20 bg-gray-900/50 flex flex-col items-center justify-center pointer-events-none ${isSelected ? "bottom-[72px] rounded-t-2xl" : "bottom-0 rounded-2xl"}`}>
                    <span className="text-[15px] font-bold text-white text-center px-6 drop-shadow-md">
                        Pay-slip already generated and locked – cannot be edited.
                    </span>
                </div>
            )}

            {/* ── ROW 1: Employee info + pill badges ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100/70">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[16px] shrink-0">
                        {emp.fullName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-[16px] font-bold text-gray-900 leading-tight">{emp.fullName}</h3>
                        <p className="text-[12px] font-semibold text-blue-500 leading-tight">{emp.employeeId}</p>
                        <p className="text-[12px] text-gray-400 leading-tight mt-0.5">{emp.designation}</p>
                    </div>
                </div>

                {/* Pill badges */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Salary type pill */}
                    <span className="px-4 py-1.5 rounded-full border border-blue-300 bg-blue-100 text-[13px] font-semibold text-blue-600">
                        {emp.salaryType === "MONTHLY" ? "Monthly" : "Daily"}
                    </span>

                    {/* Allowances pill */}
                    <button
                        onClick={(e) => { e.stopPropagation(); openManageModal("allowance", emp); }}
                        disabled={isLocked}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[13px] font-semibold transition-all
              ${isLocked
                                ? "border-blue-100 bg-blue-50 text-blue-300 cursor-not-allowed"
                                : "border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200 hover:border-blue-400 active:scale-95"
                            }`}
                    >
                        Allowances {fmt(totalAllowances)}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Deductions pill */}
                    <button
                        onClick={(e) => { e.stopPropagation(); openManageModal("deduction", emp); }}
                        disabled={isLocked}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[13px] font-semibold transition-all
              ${isLocked
                                ? "border-red-100 bg-red-50 text-red-300 cursor-not-allowed"
                                : "border-red-300 bg-red-100 text-red-500 hover:bg-red-200 hover:border-red-400 active:scale-95"
                            }`}
                    >
                        Deductions {fmt(totalDeductions_custom)}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── ROW 2: Salary info strip ── */}
            <div className="flex items-center gap-0 px-5 py-3 border-b border-blue-100/70 bg-white/60">
                {/* Monthly/Daily pay */}
                <div className="pr-6 border-r border-gray-200">
                    <p className="text-[11px] text-gray-400 mb-0.5">{emp.salaryType === "MONTHLY" ? "Monthly pay" : "Daily Rate"}</p>
                    <p className="text-[15px] font-bold text-gray-800">{fmt(basicSalary)}</p>
                </div>

                {/* OT Rate */}
                <div className="px-6 border-r border-gray-200">
                    <p className="text-[11px] text-gray-400 mb-0.5">OT rate</p>
                    <p className="text-[15px] font-bold text-gray-800">{fmt(otRate)}</p>
                </div>

                {/* OT Amount */}
                <div className="px-6 border-r border-gray-200">
                    <p className="text-[11px] text-gray-400 mb-0.5">OT amount</p>
                    <p className="text-[15px] font-bold text-gray-800">{fmt(otAmount)}</p>
                </div>

                {/* Period */}
                <div className="px-6 border-r border-gray-200">
                    <p className="text-[11px] text-gray-400 mb-0.5">Period</p>
                    <p className="text-[15px] font-bold text-gray-800">{periodLabel}</p>
                </div>

                {/* EPF/ETF toggle — pushed to right */}
                {emp.epfEnabled && (
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-[13px] font-semibold text-gray-500">EPF / ETF</span>
                        <Toggle
                            enabled={isEpfEnabled}
                            onToggle={() => handleToggleEpfEtf(emp.id)}
                            disabled={isLocked}
                        />
                        <span className="text-[16px] font-bold text-red-500">{fmt(isEpfEnabled ? epfAmount : 0)}</span>
                    </div>
                )}
            </div>

            {/* ── EXPANDED BODY ── */}
            {isSelected && (
                <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-1 duration-200">

                    {/* ── ROW 3: Input fields ── */}
                    <div className="px-5 py-4 grid grid-cols-4 gap-4 border-b border-blue-100/70">
                        {/* Worked Days */}
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Worked Days</p>
                            <input
                                type="number"
                                step="0.5"
                                value={displayWorkedDays === 0 ? "" : displayWorkedDays}
                                onChange={(e) => handleEmployeeWorkedDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                onBlur={() => setTouchedFields((prev: any) => ({ ...prev, employeeDays: { ...prev.employeeDays, [emp.id]: true } }))}
                                className={inputClass(isLocked)}
                                min="0"
                                max={companyWorkingDays}
                                disabled={isLocked}
                            />
                        </div>

                        {/* OT Hours */}
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">OT Hours</p>
                            <input
                                type="number"
                                step="0.5"
                                value={displayOtHours === 0 ? "" : displayOtHours}
                                onChange={(e) => handleEmployeeOtHoursChange(emp.id, parseFloat(e.target.value) || 0)}
                                className={inputClass(isLocked)}
                                min="0"
                                disabled={isLocked || emp.otRate <= 0}
                            />
                        </div>

                        {/* Advance */}
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Advance</p>
                            <input
                                type="number"
                                value={displaySalaryAdvance === 0 ? "" : displaySalaryAdvance}
                                onChange={(e) => handleEmployeeSalaryAdvanceChange(emp.id, parseFloat(e.target.value) || 0)}
                                className={inputClass(isLocked)}
                                min="0"
                                disabled={isLocked}
                            />
                        </div>

                        {/* Loan */}
                        {hasLoanInstallment && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 h-6">
                                    <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">Loan</p>
                                    <Toggle
                                        enabled={isLoanEnabled}
                                        onToggle={() => handleToggleLoan(emp.id)}
                                        disabled={isLocked}
                                    />
                                </div>
                                <div className={`w-full px-3 py-2 border rounded-xl text-[14px] text-right font-semibold
                  ${isLoanEnabled
                                        ? "bg-white border-gray-200 text-gray-800"
                                        : "bg-gray-50 border-gray-100 text-gray-300 line-through"
                                    }`}>
                                    {fmt(isLoanEnabled ? loanDeduction : 0)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── ROW 4: Totals + Actions ── */}
                    <div className="flex items-center px-5 py-4 gap-6 bg-white/40">
                        {/* Earnings */}
                        <div className="pr-6 border-r border-gray-200">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-1">Earnings</p>
                            <p className="text-[26px] font-extrabold text-green-500 leading-none">{fmt(totalEarnings)}</p>
                        </div>

                        {/* Deduction */}
                        <div className="pr-6 border-r border-gray-200">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-1">Deduction</p>
                            <p className="text-[26px] font-extrabold text-red-500 leading-none">{fmt(totalDeductions)}</p>
                        </div>

                        {/* Net Salary */}
                        <div className="pr-6">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-1">Net Salary</p>
                            <p className="text-[26px] font-extrabold text-blue-600 leading-none">{fmt(netSalary)}</p>
                        </div>

                        {/* Actions — pushed to right */}
                        <div className="ml-auto flex items-center gap-3">
                            {/* Generate / View */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp); }}
                                disabled={isSaving || (!isLocked && hasAnyError(emp))}
                                className={`px-7 py-3 rounded-2xl text-[14px] font-bold transition-all duration-200 flex items-center gap-2
                  ${isSaving || (!isLocked && hasAnyError(emp))
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-[#4584ff] text-white hover:bg-[#3b73e6] shadow-sm hover:shadow-md active:scale-95"
                                    }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isLocked ? (
                                    <><Eye className="w-4 h-4" /> View</>
                                ) : (
                                    "Generate"
                                )}
                            </button>

                            {/* Confirm — always visible, disabled when locked */}
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!isLocked) setIsConfirmModalOpen(true); }}
                                disabled={isLocked || isSaving || hasAnyError(emp)}
                                className={`px-7 py-3 rounded-2xl text-[14px] font-bold transition-all duration-200
                    ${isLocked || isSaving || hasAnyError(emp)
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-[#28aa58] text-white hover:bg-[#23964e] shadow-sm hover:shadow-md active:scale-95"
                                    }`}
                            >
                                Confirm
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

            {/* ── Confirm Modal ── */}
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
                                    {emp.salaryType === "MONTHLY" ? "Monthly" : "Daily"} &ndash; {periodLabel}
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
                                    handleConfirmPayslip(emp);
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