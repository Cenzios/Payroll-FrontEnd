import React, { useState } from "react";
import { Loader2, ChevronRight, Eye, Lock, ArrowBigDown, ArrowDown, Loader, ChevronDown, ArrowUpRight, LockKeyhole } from "lucide-react";
import { Employee } from "../types/employee.types";
import { useAppSelector } from "../store/hooks";

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
    selectedMonth: number;
    selectedYear: number;
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
    selectedMonth,
    selectedYear,
}: EmployeeSalaryCardProps) => {
    const { accessStatus } = useAppSelector((state) => state.auth);
    const isSelected = selectedEmployee?.id === emp.id;

    // const isLocked = !!generatedSalary;
    const [isLockedLocal, setIsLockedLocal] = useState(!!generatedSalary);
    const isLocked = isLockedLocal || !!generatedSalary;

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Derived calculations
    // const displayWorkedDays = isLocked ? generatedSalary.workingDays : workedDays;
    // const displayOtHours = isLocked ? generatedSalary.otHours : otHours;
    // const displaySalaryAdvance = isLocked ? generatedSalary.salaryAdvance : salaryAdvance;
    const displayWorkedDays = isLocked && generatedSalary ? generatedSalary.workingDays : workedDays;
    const displayOtHours = isLocked && generatedSalary ? generatedSalary.otHours : otHours;
    const displaySalaryAdvance = isLocked && generatedSalary ? generatedSalary.salaryAdvance : salaryAdvance;

    const basicSalary = emp.basicSalary || 0;
    const otRate = emp.otRate || 0;
    // const otAmount = isLocked ? generatedSalary.otAmount : displayOtHours * otRate;
    const otAmount = isLocked && generatedSalary ? generatedSalary.otAmount : displayOtHours * otRate;

    const currentAllowances = salaryAllowances[emp.id] || emp.recurringAllowances || [];
    // const totalAllowances = isLocked
    const totalAllowances = isLocked && generatedSalary
        ? generatedSalary.allowanceTotal
        : currentAllowances.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const currentDeductions = salaryDeductions[emp.id] || emp.recurringDeductions || [];
    // const totalDeductions_custom = isLocked
    const totalDeductions_custom = isLocked && generatedSalary
        ? generatedSalary.deductionTotal - (generatedSalary.loanDeduction || 0)
        : currentDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // const basicPay = isLocked
    const basicPay = isLocked && generatedSalary
        ? generatedSalary.basicPay
        : emp.salaryType === "MONTHLY"
            ? companyWorkingDays > 0
                ? (() => {
                    const absentDays = Math.max(0, companyWorkingDays - displayWorkedDays);
                    const applicablePaidLeaves = Math.min(emp.paidLeave || 0, absentDays);
                    const payableDays = displayWorkedDays + applicablePaidLeaves;
                    return (basicSalary / companyWorkingDays) * payableDays;
                })()
                : 0
            : basicSalary * displayWorkedDays;

    // const epfAmount = isLocked
    const epfAmount = isLocked && generatedSalary
        ? generatedSalary.employeeEPF
        : emp.epfEnabled && isEpfEnabled
            ? basicPay * 0.08
            : 0;

    //   const totalEarnings = isLocked
    const totalEarnings = isLocked && generatedSalary
        ? generatedSalary.grossSalary
        : basicPay + (emp.otRate > 0 ? otAmount : 0) + totalAllowances;

    // const totalDeductions = isLocked
    const totalDeductions = isLocked && generatedSalary
        ? generatedSalary.totalDeduction
        : displaySalaryAdvance +
        epfAmount +
        (hasLoanInstallment && isLoanEnabled ? loanDeduction : 0) +
        totalDeductions_custom;

    //    const netSalary = isLocked ? generatedSalary.netSalary : totalEarnings - totalDeductions;
    const netSalary = isLocked && generatedSalary
        ? generatedSalary.netSalary : totalEarnings - totalDeductions;

    // Current period label
    const periodLabel = new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short", year: "numeric" });

    // const periodLabel = new Date(selectedYear, selectedMonth).toLocaleString("default", {
    //     month: "long",
    //     year: "numeric",
    // });

    const inputClass = (locked: boolean) =>
        `w-full px-3 py-2 border rounded-xl text-[14px] text-right focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none no-spinner font-semibold
    ${locked
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-800 hover:border-blue-300"
        }`;

    const handleCardClick = () => {
        if (accessStatus === 'BLOCKED') {
            window.dispatchEvent(new CustomEvent('open-renew-modal'));
            return;
        }
        handleSelectEmployee(emp);
    };

    return (
        <div
            onClick={handleCardClick}

            className={`relative bg-[#f0f5ff] rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden
        ${isSelected
                    ? "border-[#407BFF] shadow-lg ring-1 ring-blue-200"
                    : "border-[#407BFF] border-l-4 border-l-[#407BFF] "
                }`}
        >
            {/* Full Card Overlay (when not selected) */}
            {isLocked && !isSelected && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center transition-all duration-300 pointer-events-none rounded-2xl">
                    {/* <div className="bg-white/90 border border-white/50 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl backdrop-blur-md">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-gray-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-bold text-gray-800">Pay-slip Locked</span>
                    </div> */}

                </div>
            )}

            <div className="relative">

                {/* ── ROW 1: Employee info + pill badges ── */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#F9FCFF] border-b border-blue-100/70">
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
                        <span className="px-4 py-1.5 rounded-full border border-[#0B74E633] bg-[#DEEEFF1F] text-[13px] font-semibold text-blue-600">
                            {emp.salaryType === "MONTHLY" ? "Monthly" : "Daily"}
                        </span>

                        {/* Allowances pill */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (accessStatus === 'BLOCKED') {
                                    window.dispatchEvent(new CustomEvent('open-renew-modal'));
                                    return;
                                }
                                openManageModal("allowance", emp);
                            }}
                            disabled={isLocked}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[13px] font-semibold transition-all
              ${isLocked
                                    ? "border-[#0B74E633] bg-[#DEEEFF1F] text-blue-300 cursor-not-allowed"
                                    : "border-[#0B74E633] bg-[#DEEEFF1F] text-blue-600 hover:bg-blue-200 hover:border-blue-400 active:scale-95"
                                }`}
                        >
                            Allowances {fmt(totalAllowances)}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Deductions pill */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (accessStatus === 'BLOCKED') {
                                    window.dispatchEvent(new CustomEvent('open-renew-modal'));
                                    return;
                                }
                                openManageModal("deduction", emp);
                            }}
                            disabled={isLocked}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[13px] font-semibold transition-all
              ${isLocked
                                    ? "border-[#EF444433] bg-[#FFB3B31A] text-[#EF4444] cursor-not-allowed"
                                    : "border-[#EF444433] bg-[#FFB3B31A] text-[#EF4444] hover:bg-red-200 hover:border-red-400 active:scale-95"
                                }`}
                        >
                            Deductions {fmt(totalDeductions_custom)}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── ROW 2: Salary info strip ── */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-100/70 bg-white">
                    {/* Monthly/Daily pay */}
                    <div className="pr-6 border-r border-gray-200">
                        <p className="text-[12px] text-gray-400 mb-0.5">{emp.salaryType === "MONTHLY" ? "Monthly pay" : "Daily Rate"}</p>
                        <p className="text-[15px] font-bold text-gray-800">{fmt(basicSalary)}</p>
                    </div>

                    {/* OT Rate */}
                    {emp.otRate > 0 && (
                        <div className="px-6 border-r border-gray-200">
                            <p className="text-[12px] text-gray-400 mb-0.5">OT rate</p>
                            <p className="text-[15px] font-bold text-gray-800">{fmt(otRate)}</p>
                        </div>
                    )}

                    {/* OT Amount */}
                    {emp.otRate > 0 && (
                        <div className="px-6 border-r border-gray-200">
                            <p className="text-[12px] text-gray-400 mb-0.5">OT amount</p>
                            <p className="text-[15px] font-bold text-gray-800">{fmt(otAmount)}</p>
                        </div>
                    )}

                    {/* Period */}
                    <div className="px-6 border-r border-gray-200">
                        <p className="text-[12px] text-gray-400 mb-0.5">Period</p>
                        <p className="text-[15px] font-bold text-gray-800">{periodLabel}</p>
                    </div>

                    {/* EPF/ETF toggle — pushed to right */}
                    {emp.epfEnabled && (
                        <div className="ml-auto flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-500">EPF / ETF</span>
                            <Toggle
                                enabled={isEpfEnabled}
                                onToggle={() => {
                                    if (accessStatus === 'BLOCKED') {
                                        window.dispatchEvent(new CustomEvent('open-renew-modal'));
                                        return;
                                    }
                                    handleToggleEpfEtf(emp.id);
                                }}
                                disabled={isLocked}
                            />
                            <span className="text-[16px] font-bold text-red-500">{fmt(isEpfEnabled ? epfAmount : 0)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EXPANDED BODY ── */}
            {isSelected && (
                <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-1 duration-200 relative">
                    {/* Badge Overlay for Locked State */}
                    {isLocked && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#00000099]/40 backdrop-blur-[2px] rounded-b-2xl">
                            <div className="bg-[#FFFFFF66] border border-gray-600 rounded-2xl flex items-center shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-4 px-6 py-4 border-r border-gray-400/50">
                                    <div>
                                        <LockKeyhole className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-gray-900 leading-tight">Pay-slip locked</h4>
                                        <p className="text-[12px] font-medium text-gray-600">Generated - no further edits allowed</p>
                                    </div>
                                </div>
                                <div className="px-6 py-4 h-full flex items-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp); }}
                                        className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg font-bold text-[14px]"
                                    >
                                        <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                                        View Pay-slip
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ROW 3: Input fields ── */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-100/70 bg-white">
                        {/* Worked */}
                        <div className="pr-6 w-[120px] border-r border-gray-200">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Worked Days</p>
                            <input
                                type="number"
                                step="0.5"
                                value={displayWorkedDays === 0 ? "" : displayWorkedDays}
                                onChange={(e) => handleEmployeeWorkedDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                onBlur={() => setTouchedFields((prev: any) => ({ ...prev, employeeDays: { ...prev.employeeDays, [emp.id]: true } }))}
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                className={inputClass(isLocked)}
                                min="0"
                                max={companyWorkingDays}
                                disabled={isLocked}
                            />
                        </div>

                        {/* OT Hours */}
                        {emp.otRate > 0 && (
                            <div className="px-6 w-40 border-r border-gray-200">
                                <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">OT Hours</p>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={displayOtHours === 0 ? "" : displayOtHours}
                                    onChange={(e) => handleEmployeeOtHoursChange(emp.id, parseFloat(e.target.value) || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                    className={inputClass(isLocked)}
                                    min="0"
                                    disabled={isLocked || emp.otRate <= 0}
                                />
                            </div>
                        )}

                        {/* Advance */}
                        <div className="px-6 w-40 border-r border-gray-200">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Advance</p>
                            <input
                                type="number"
                                value={displaySalaryAdvance === 0 ? "" : displaySalaryAdvance}
                                onChange={(e) => handleEmployeeSalaryAdvanceChange(emp.id, parseFloat(e.target.value) || 0)}
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                                className={inputClass(isLocked)}
                                min="0"
                                disabled={isLocked}
                            />
                        </div>

                        {/* Loan */}
                        <div className="px-6 w-44 border-r border-gray-200">
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
                    </div>

                    {/* ── ROW 4: Totals + Actions ── */}
                    <div className="flex items-center px-5 py-4 gap-6 bg-[#F9FCFF]">
                        {/* Earnings */}
                        <div className="pr-6 border-r border-gray-200">
                            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Earnings</p>
                            <p className="text-[20px] font-extrabold text-[#10b981] leading-none">{fmt(totalEarnings)}</p>
                        </div>

                        {/* Deduction */}
                        <div className="pr-6 border-r border-gray-200">
                            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Deduction</p>
                            <p className="text-[20px] font-extrabold text-red-500 leading-none">{fmt(totalDeductions)}</p>
                        </div>

                        {/* Net Salary */}
                        <div className="pr-6">
                            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Net Salary</p>
                            <p className="text-[20px] font-extrabold text-[#4785ff] leading-none">{fmt(netSalary)}</p>
                        </div>

                        {/* Actions — pushed to right */}
                        <div className={`ml-auto flex items-center gap-3 ${isLocked ? "relative z-30" : ""}`}>
                            {/* Generate / View */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp); }}
                                disabled={isSaving || (!isLocked && hasAnyError(emp))}
                                className={`px-7 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-200 flex items-center gap-2 pointer-events-auto
                  ${isSaving || (!isLocked && hasAnyError(emp))
                                        ? "bg-gray-200 text-[#4584ff] cursor-not-allowed"
                                        : isLocked
                                            ? "relative z-30 bg-[#4584ff] text-white hover:bg-[#3b73e6] shadow-[0_0_15px_rgba(69,132,255,0.4)] border border-[#6b9dff] active:scale-95"
                                            : "bg-[#4584ff] text-white hover:bg-[#3b73e6] shadow-sm hover:shadow-md active:scale-95"
                                    }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isLocked ? (
                                    "View Pay-Slip"
                                ) : (
                                    "Generate"
                                )}
                            </button>

                            {/* Confirm — always visible, disabled when locked */}
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!isLocked) setIsConfirmModalOpen(true); }}
                                disabled={isLocked || isSaving || hasAnyError(emp)}
                                className={`px-6 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-200
                    ${isLocked
                                        ? "relative z-30 bg-[#40444d] text-[#868c98] cursor-not-allowed pointer-events-auto border justify-center border-transparent"
                                        : isSaving || hasAnyError(emp)
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-[#2dac5c] text-white hover:bg-[#23964e] shadow-sm hover:shadow-md active:scale-95 pointer-events-auto"
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isSelected && (
                <div className="relative">
                    <div className="flex justify-center items-center gap-10 px-5 py-3 text-[12px] bg-[#F8F9FE] text-gray-400 italic">
                        <div className="flex">
                            <Loader className="w-5 h-5 rounded-full p-[2.5px] bg-[#5C81FE] text-white mr-2" />
                            <p className="text-[#3D70F5] font-semibold">Click to Calculate Salary</p>
                        </div>
                        {/* <div className="flex">
                            <p className="text-[#8791A9] font-extralight">Enter OT hours, deductions & generate pay-slip</p>
                            <ChevronDown className="w-4 h-4 text-[#8791A9] ml-1" />
                        </div> */}
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {isConfirmModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-[26px] p-6 w-full max-w-[460px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in duration-200">

                        {/* HEADER */}
                        <div className="flex items-start gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>

                            <div>
                                <h3 className="text-[18px] font-bold text-gray-900">
                                    Confirm & Lock Payslip
                                </h3>
                                <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">
                                    Once locked, this payslip cannot be edited or reversed. <br />
                                    Please review carefully before proceeding.
                                </p>
                            </div>
                        </div>

                        {/* INFO CARD */}
                        <div className="bg-[#f6f9ff] border border-[#b9cdf7] rounded-2xl p-4 mb-5">

                            {/* Top row */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[14px] font-semibold text-gray-900">
                                        {emp.fullName}
                                    </p>
                                    <p className="text-[12px] text-gray-500">
                                        ID: {emp.employeeId}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-[11px] text-gray-400">PAY PERIOD</p>
                                    <p className="text-[13px] font-semibold text-gray-900">
                                        {periodLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-[#b9cdf7] my-3"></div>

                            {/* Earnings / Deductions */}
                            <div className="flex justify-between text-[13px] mb-3">
                                <div>
                                    <p className="text-gray-500">Earnings</p>
                                    <p className="text-green-600 font-semibold">
                                        {fmt(totalEarnings)}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-gray-500">Deductions</p>
                                    <p className="text-red-500 font-semibold">
                                        - {fmt(totalDeductions)}
                                    </p>
                                </div>
                            </div>

                            {/* NET SALARY BAR */}
                            <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex justify-between items-center shadow-inner">
                                <span className="text-[13px] font-semibold tracking-wide">
                                    NET SALARY
                                </span>
                                <span className="text-[15px] font-bold">
                                    {fmt(netSalary)}
                                </span>
                            </div>
                        </div>

                        {/* WARNING */}
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-5">
                            <span className="text-red-500 text-lg leading-none">⚠</span>
                            <p className="text-[12px] text-red-500 leading-snug">
                                This action is permanent. The payslip will be locked and distributed to the employee.
                            </p>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3 text-sm">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600">
                                Cancel
                            </button>

                            <button
                                // onClick={() => {
                                //     handleConfirmPayslip(emp);
                                //     setIsConfirmModalOpen(false);
                                // }}
                                onClick={() => {
                                    handleConfirmPayslip(emp);
                                    setIsConfirmModalOpen(false);
                                    setIsLockedLocal(true);
                                }}
                                className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600">
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