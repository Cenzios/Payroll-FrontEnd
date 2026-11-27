import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { Loader2, ChevronRight, Loader, Eye, FileText } from "lucide-react";
import { Employee } from "../types/employee.types";
import { useAppSelector } from "../store/hooks";
import type { SalaryRecord } from "../types/salary.types";
import type { SalaryEntry } from "../store/slices/salarySlice";
import { formatMoney, MoneyInput, toDecimal } from "../utils/money";
import { computeSalaryCardFigures } from "../utils/salaryCardCalc";
import SalaryDraftPanel from "./salary/SalaryDraftPanel";
import SalaryStatusBadge from "./salary/SalaryStatusBadge";

/** Draft workflow callbacks for a saved salary (see SalaryDraftPanel). */
export interface SalaryDraftHandlers {
    isWorkflowBusy: boolean;
    onEditDraft: (emp: Employee, salary: SalaryRecord) => void;
    onCancelEdit: () => void;
    onRegenerateDraft: (salary: SalaryRecord) => Promise<void>;
    onVoidDraft: (salary: SalaryRecord) => Promise<void>;
    onApproveDraft: (salary: SalaryRecord) => Promise<void>;
}

interface EmployeeSalaryCardProps {
    emp: Employee;
    generatedSalary?: SalaryRecord;
    selectedEmployee: Employee | null;
    handleSelectEmployee: (emp: Employee) => void;
    workedDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    otHours: number;
    salaryAdvance: string; // decimal string
    leaveDays: number;
    sickLeaveDays: number;
    loanDeduction: string; // decimal string
    companyWorkingDays: number;
    maxWorkedDays: number;
    hasLoanInstallment: boolean;
    handleEmployeeWorkedDaysChange: (empId: string, val: number) => void;
    handleEmployeeOtHoursChange: (empId: string, val: number) => void;
    handleEmployeeSalaryAdvanceChange: (empId: string, raw: string) => void;
    handleEmployeeLeaveDaysChange: (empId: string, val: number) => void;
    handleEmployeeSickLeaveDaysChange: (empId: string, val: number) => void;
    handleToggleLoan: (empId: string) => void;
    handleToggleEpfEtf: (empId: string) => void;
    handleGeneratePayslip: (emp: Employee) => void;
    handleConfirmPayslip: (emp: Employee) => void;
    openManageModal: (type: "allowance" | "deduction", emp: Employee) => void;
    salaryAllowances: Record<string, SalaryEntry[]>;
    salaryDeductions: Record<string, SalaryEntry[]>;
    isSaving: boolean;
    hasAnyError: (emp: Employee) => boolean;
    setTouchedFields: React.Dispatch<React.SetStateAction<any>>;
    selectedMonth: number;
    selectedYear: number;
    /** True while this employee's DRAFT is open for editing (inputs unlocked). */
    isEditingDraft: boolean;
    draftHandlers: SalaryDraftHandlers;
}

const fmt = (val: MoneyInput): string => formatMoney(val);

/** Input display: '' for zero, otherwise the plain decimal (e.g. "1500" not "1500.0000"). */
/** Unsaved advance exactly as typed ("1000.", "1000.25"); "0" shows as empty. */
const advanceInputValue = (val: string): string => (toDecimal(val).isZero() && !val.includes('.') ? "" : val);

const inputDisplay = (val: MoneyInput): string => {
    const d = toDecimal(val);
    return d.isZero() ? "" : d.toFixed();
};

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
        onClick={(e) => {
            e.stopPropagation();
            onToggle();
        }}
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
    leaveDays,
    sickLeaveDays,
    loanDeduction,
    companyWorkingDays,
    maxWorkedDays,
    hasLoanInstallment,
    handleEmployeeWorkedDaysChange,
    handleEmployeeOtHoursChange,
    handleEmployeeSalaryAdvanceChange,
    handleEmployeeLeaveDaysChange,
    handleEmployeeSickLeaveDaysChange,
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
    isEditingDraft,
    draftHandlers,
}: EmployeeSalaryCardProps) => {
    const { accessStatus } = useAppSelector((state) => state.auth);
    const isSelected = selectedEmployee?.id === emp.id;

    // A saved salary is read-only unless its DRAFT is being edited; APPROVED is always locked
    const isLocked = !!generatedSalary && !isEditingDraft;

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Derived calculations
    // const displayWorkedDays = isLocked ? generatedSalary.workingDays : workedDays;
    // const displayOtHours = isLocked ? generatedSalary.otHours : otHours;
    // const displaySalaryAdvance = isLocked ? generatedSalary.salaryAdvance : salaryAdvance;
    const displayWorkedDays = isLocked && generatedSalary ? generatedSalary.workingDays : workedDays;
    const displayOtHours: MoneyInput = isLocked && generatedSalary ? generatedSalary.otHours : otHours;
    const displaySalaryAdvance: MoneyInput = isLocked && generatedSalary ? generatedSalary.salaryAdvance : salaryAdvance;

    const basicSalary = emp.basicSalary || "0";
    const otRate = emp.otRate || "0";
    const hasOtRate = toDecimal(emp.otRate).greaterThan(0);

    const currentAllowances = salaryAllowances[emp.id] || emp.recurringAllowances || [];
    const currentDeductions = salaryDeductions[emp.id] || emp.recurringDeductions || [];

    // All money maths via decimal.js (utils/salaryCardCalc.ts)
    const {
        otAmount,
        totalAllowances,
        customDeductions: totalDeductions_custom,
        epfAmount,
        totalEarnings,
        totalDeductions,
        netSalary,
    } = computeSalaryCardFigures({
        emp,
        saved: isLocked ? generatedSalary : undefined,
        workedDays,
        otHours,
        salaryAdvance,
        leaveDays,
        sickLeaveDays,
        loanDeduction,
        companyWorkingDays,
        isEpfEnabled,
        isLoanEnabled,
        hasLoanInstallment,
        allowances: currentAllowances,
        deductions: currentDeductions,
    });

    // Current period label
    const periodLabel = new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short", year: "numeric" });

    // const periodLabel = new Date(selectedYear, selectedMonth).toLocaleString("default", {
    //     month: "long",
    //     year: "numeric",
    // });

    {/*const isEpfEnabledRef = useRef(isEpfEnabled);
    useEffect(() => {
        isEpfEnabledRef.current = isEpfEnabled;
    }, [isEpfEnabled]);

    // Auto-disable EPF/ETF when unpaid leave === working days
    useEffect(() => {
        if (
            emp.epfEnabled &&
            isEpfEnabledRef.current &&
            !isLocked &&
            companyWorkingDays > 0 &&
            sickLeaveDays === companyWorkingDays
        ) {
            handleToggleEpfEtf(emp.id);
        }
    }, [sickLeaveDays, companyWorkingDays, isLocked, emp.epfEnabled, emp.id]);*/}

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

    const blockInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['+', '-', 'e', 'E', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div
            onClick={handleCardClick}

            className={`relative bg-[#f0f5ff] rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden
        ${isSelected
                    ? "border-[#407BFF] shadow-lg ring-1 ring-blue-200"
                    : "border-[#407BFF] border-l-4 border-l-[#407BFF] hover:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 hover:border-blue-400 hover:bg-[#ebf2ff]"
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 md:px-5 py-3 md:py-4 bg-[#F9FCFF] border-b border-blue-100/70">
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
                    <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
                        {generatedSalary && <SalaryStatusBadge status={generatedSalary.status} />}
                        {/* Salary type pill */}
                        <span className="px-4 py-1.5 rounded-full border border-[#0B74E633] bg-[#DEEEFF1F] text-[13px] font-semibold text-blue-600 
                        max-sm:text-[10px] max-sm:px-2 max-sm:py-1 max-sm:rounded-lg">
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
                                    ? "border-[#0B74E633] bg-[#DEEEFF1F] text-blue-300 cursor-not-allowed max-sm:text-[10px] max-sm:px-2 max-sm:py-1 max-sm:rounded-lg"
                                    : "border-[#0B74E633] bg-[#DEEEFF1F] text-blue-600 hover:bg-blue-200 hover:border-blue-400 active:scale-95 max-sm:text-[10px] max-sm:px-2 max-sm:py-1 max-sm:rounded-lg"
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
                                    ? "border-[#EF444433] bg-[#FFB3B31A] text-red-300 cursor-not-allowed max-sm:text-[10px] max-sm:px-2 max-sm:py-1 max-sm:rounded-lg"
                                    : "border-[#EF444433] bg-[#FFB3B31A] text-[#EF4444] hover:bg-red-200 hover:border-red-400 active:scale-95 max-sm:text-[10px] max-sm:px-2 max-sm:py-1 max-sm:rounded-lg"
                                }`}
                        >
                            Deductions {fmt(totalDeductions_custom)}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── ROW 2: Salary info strip ── */}
                <div className="flex flex-wrap items-center gap-y-2 px-4 md:px-5 py-3 border-b border-blue-100/70 bg-white">
                    {/* Monthly/Daily pay */}
                    <div className="pr-4 md:pr-6 border-r border-gray-200 w-1/2 md:w-auto max-sm:border-none">
                        <p className="text-[12px] text-gray-400 mb-0.5">{emp.salaryType === "MONTHLY" ? "Monthly pay" : "Daily Rate"}</p>
                        <p className="text-[15px] font-bold text-gray-800">{fmt(basicSalary)}</p>
                    </div>

                    {/* OT Rate */}
                    {hasOtRate && (
                        <div className="px-4 md:px-6 border-r border-gray-200 w-1/2 md:w-auto max-sm:border-none">
                            <p className="text-[12px] text-gray-400 mb-0.5">OT rate</p>
                            <p className="text-[15px] font-bold text-gray-800">{fmt(otRate)}</p>
                        </div>
                    )}

                    {/* OT Amount */}
                    {hasOtRate && (
                        <div className="px-4 md:px-6 border-r border-gray-200 w-1/2 md:w-auto max-sm:border-none">
                            <p className="text-[12px] text-gray-400 mb-0.5">OT amount</p>
                            <p className="text-[15px] font-bold text-gray-800">{fmt(otAmount)}</p>
                        </div>
                    )}

                    {/* Period */}
                    <div className="px-4 md:px-6 md:border-r border-gray-200 w-1/2 md:w-auto max-sm:border-none">
                        <p className="text-[12px] text-gray-400 mb-0.5">Month</p>
                        <p className="text-[15px] font-bold text-gray-800">{periodLabel}</p>
                    </div>

                    {/* EPF/ETF toggle — pushed to right */}
                    {emp.epfEnabled && (
                        <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
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
                            <span className="text-[16px] font-bold text-red-500">{fmt(isEpfEnabled ? epfAmount : "0")}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EXPANDED BODY ── */}
            {isSelected && (
                <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-1 duration-200 relative">
                    {/* Saved salary: approved = locked; draft = edit / regenerate / void / approve */}
                    {isLocked && generatedSalary && (
                        <SalaryDraftPanel
                            salary={generatedSalary}
                            employeeName={emp.fullName}
                            employeeCode={emp.employeeId}
                            periodLabel={periodLabel}
                            busy={draftHandlers.isWorkflowBusy}
                            onView={() => handleGeneratePayslip(emp)}
                            onEdit={() => draftHandlers.onEditDraft(emp, generatedSalary)}
                            onRegenerate={() => draftHandlers.onRegenerateDraft(generatedSalary)}
                            onVoid={() => draftHandlers.onVoidDraft(generatedSalary)}
                            onApprove={() => draftHandlers.onApproveDraft(generatedSalary)}
                        />
                    )}

                    {/* ── ROW 3: Input fields ── */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-100/70 bg-white
                    max-sm:grid max-sm:grid-cols-3">
                        {/* Worked */}
                        <div className="pr-2 w-[calc(50%-8px)] md:w-[120px] border-r border-gray-200
                        max-sm:border-none max-sm:w-[90px]">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Worked Days</p>
                            <input
                                type="number"
                                step="0.5"
                                value={displayWorkedDays === 0 ? "" : displayWorkedDays}
                                onChange={(e) => handleEmployeeWorkedDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                onBlur={() => setTouchedFields((prev: any) => ({ ...prev, employeeDays: { ...prev.employeeDays, [emp.id]: true } }))}
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={blockInvalidNumberKeys}
                                className={inputClass(isLocked)}
                                min="0"
                                max={maxWorkedDays}
                                disabled={isLocked}
                            />
                        </div>

                        {/* OT Hours */}
                        {hasOtRate && (
                            <div className="px-2 w-[calc(50%-8px)] md:w-[120px] border-r border-gray-200
                        max-sm:border-none max-sm:w-[90px]">
                                <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">OT Hours</p>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={inputDisplay(displayOtHours)}
                                    onChange={(e) => handleEmployeeOtHoursChange(emp.id, parseFloat(e.target.value) || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={inputClass(isLocked)}
                                    min="0"
                                    disabled={isLocked || !hasOtRate}
                                />
                            </div>
                        )}

                        {/* Advance */}
                        <div className="px-2 w-[calc(50%-8px)] md:w-[120px] border-r border-gray-200
                        max-sm:border-none max-sm:w-[90px]">
                            <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center
                            max-sm:top-0">Advance</p>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={isLocked ? inputDisplay(displaySalaryAdvance) : advanceInputValue(salaryAdvance)}
                                onChange={(e) => handleEmployeeSalaryAdvanceChange(emp.id, e.target.value)}
                                className={inputClass(isLocked)}
                                disabled={isLocked}
                            />
                        </div>

                        {/* Annual Leave (Monthly Only) */}
                        {emp.salaryType === "MONTHLY" && (
                            <div className="px-2 w-[calc(50%-8px)] md:w-[120px] border-r border-gray-200 pt-0 md:pt-5
                        max-sm:border-none max-sm:w-[90px]">
                                <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Paid Leaves</p>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        step="1"
                                        value={leaveDays === 0 ? "" : leaveDays}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const capped = Math.min(val, emp.paidLeave ?? 0);
                                            handleEmployeeLeaveDaysChange(emp.id, capped);
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onKeyDown={blockInvalidNumberKeys}
                                        className={inputClass(isLocked || (emp.paidLeave ?? 0) === 0)}
                                        min="0"
                                        max={emp.paidLeave}
                                        disabled={isLocked || (emp.paidLeave ?? 0) === 0}
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium text-right" title={`Paid leave left in ${selectedYear}`}>Bal {selectedYear}: {emp.paidLeave || 0}d</p>
                                </div>
                            </div>
                        )}

                        {/* Sick Leave (Monthly Only) */}
                        {emp.salaryType === "MONTHLY" && (
                            <div className="px-2 w-[calc(50%-8px)] md:w-[120px] border-r border-gray-200
                        max-sm:border-none max-sm:w-[90px]">
                                <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-2 h-6 flex items-center">Unpaid Leaves</p>
                                <input
                                    type="number"
                                    step="1"
                                    value={sickLeaveDays === 0 ? "" : sickLeaveDays}
                                    onChange={(e) => handleEmployeeSickLeaveDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={inputClass(isLocked)}
                                    min="0"
                                    disabled={isLocked}
                                />
                            </div>
                        )}

                        {/* Loan */}
                        <div className="px-2 w-[calc(50%-8px)] md:w-[120px] 
                        max-sm:border-none max-sm:w-[90px]">
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
                                        {fmt(isLoanEnabled ? loanDeduction : "0")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ROW 4: Totals + Actions ── */}
                    <div className="flex flex-col md:flex-row md:items-center px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-6 bg-[#F9FCFF]">
                        <div className="flex items-center gap-4 md:gap-6 md:contents">
                            {/* Earnings */}
                            <div className="pr-4 md:pr-6 border-r border-gray-200 max-sm:border-none">
                                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Earnings</p>
                                <p className="text-[16px] md:text-[20px] font-extrabold text-[#10b981] leading-none">{fmt(totalEarnings)}</p>
                            </div>

                            {/* Deduction */}
                            <div className="pr-4 md:pr-6 border-r border-gray-200 max-sm:border-none">
                                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Deduction</p>
                                <p className="text-[16px] md:text-[20px] font-extrabold text-red-500 leading-none">{fmt(totalDeductions)}</p>
                            </div>

                            {/* Net Salary */}
                            <div className="pr-6">
                                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Net Salary</p>
                                <p className="text-[16px] md:text-[20px] font-extrabold text-[#4785ff] leading-none">{fmt(netSalary)}</p>
                            </div>
                        </div>

                        {/* Actions — pushed to right */}
                        <div className={`flex flex-wrap md:justify-end items-center gap-3 w-full md:w-auto md:ml-auto ${isLocked ? "relative z-30" : ""}`}>
                            {/* Generate / View */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp); }}
                                disabled={isSaving || (!isLocked && hasAnyError(emp))}
                                className={`flex-1 md:flex-none px-4 md:px-7 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 pointer-events-auto
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

                            {isEditingDraft && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); draftHandlers.onCancelEdit(); }}
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl text-[14px] font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel edit
                                </button>
                            )}

                            {/* Save as draft (new) / Save changes (editing a draft); disabled when locked */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocked) return;
                                    if (isEditingDraft) handleConfirmPayslip(emp);
                                    else setIsConfirmModalOpen(true);
                                }}
                                disabled={isLocked || isSaving || hasAnyError(emp)}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-200
                    ${isLocked
                                        ? "relative z-30 bg-[#40444d] text-[#868c98] cursor-not-allowed pointer-events-auto border justify-center border-transparent"
                                        : isSaving || hasAnyError(emp)
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-[#2dac5c] text-white hover:bg-[#23964e] shadow-sm hover:shadow-md active:scale-95 pointer-events-auto"
                                    }`}
                            >
                                {isEditingDraft ? "Save changes" : "Save draft"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isSelected && (
                <div className="relative">
                    <div className="flex justify-center items-center gap-10 px-5 py-3 text-[12px] bg-[#F8F9FE] text-gray-400 italic">
                        <div className="flex">
                            {isLocked ? (
                                <Eye className="w-5 h-5 rounded-full p-[2.5px] bg-[#5C81FE] text-white mr-2" />
                            ) : (
                                <Loader className="w-5 h-5 rounded-full p-[2.5px] bg-[#5C81FE] text-white mr-2" />
                            )}
                            <p className="text-[#3D70F5] font-semibold">
                                {!generatedSalary
                                    ? "Click to Calculate Salary"
                                    : generatedSalary.status === "DRAFT"
                                        ? "Draft - click to review, edit or approve"
                                        : "Approved - click to view pay-slip"}
                            </p>
                        </div>

                        {/* <div className="flex">
                            <p className="text-[#8791A9] font-extralight">Enter OT hours, deductions & generate pay-slip</p>
                            <ChevronDown className="w-4 h-4 text-[#8791A9] ml-1" />
                        </div> */}
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {isConfirmModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-[26px] p-6 w-full max-w-[460px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in duration-200">

                        {/* HEADER */}
                        <div className="flex items-start gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>

                            <div>
                                <h3 className="text-[18px] font-bold text-gray-900">
                                    Save salary as draft
                                </h3>
                                <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">
                                    The draft can still be edited, regenerated or voided. <br />
                                    Approve it when it is final.
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
                                    <p className="text-[11px] text-gray-400">Month</p>
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
                                        {fmt(totalDeductions)}
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
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-5">
                            <span className="text-blue-500 text-lg leading-none">ℹ</span>
                            <p className="text-[12px] text-blue-700 leading-snug">
                                Drafts are not paid or reported yet: Bank Advice, EPF/ETF, C-Form and the payslip download only include approved salaries.
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
                                }}
                                className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600">
                                Save draft
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


export default EmployeeSalaryCard;