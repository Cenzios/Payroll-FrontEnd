import type Decimal from 'decimal.js';
import type { Employee } from '../types/employee.types';
import type { LoanInstallment, PayslipLine, SalaryDetails, SalaryRecord } from '../types/salary.types';
import type { SalaryEntry } from '../store/slices/salarySlice';
import { isPositive, toDecimal } from './money';
import { applicableAnnualLeave, calculateDailyRate, PayslipAmounts } from './salaryCalc';

/** Internal precision for preview amounts (matches DECIMAL(19,4)). */
const PREVIEW_DP = 4;

export interface PreviewContext {
    emp: Employee;
    amounts: PayslipAmounts;
    workedDays: number;
    otHours: number;
    salaryAdvance: string;
    leaveDays: number;
    sickLeaveDays: number;
    loanDeduction: string;
    isEpfEnabled: boolean;
    allowances: readonly SalaryEntry[];
    deductions: readonly SalaryEntry[];
    loanInstallments: readonly LoanInstallment[];
    ordinal: (n: number) => string;
}

/** Remaining amount on a loan installment (amount − paidAmount). */
export function installmentRemaining(inst: LoanInstallment): string {
    return toDecimal(inst.amount).minus(toDecimal(inst.paidAmount)).toFixed(PREVIEW_DP);
}

/** Payslip preview for an unsaved (calculated) salary. */
export function buildPreviewDetails(ctx: PreviewContext): SalaryDetails {
    const { emp, amounts } = ctx;
    const fx = (value: Decimal): string => value.toFixed(PREVIEW_DP);
    return {
        basicSalary: toDecimal(emp.basicSalary).toFixed(PREVIEW_DP),
        salaryType: emp.salaryType || 'MONTHLY',
        basicPay: fx(amounts.basicPay),
        epfEmployee: fx(amounts.epfEmployee),
        epfEmployer: fx(amounts.epfEmployer),
        etfEmployer: fx(amounts.etfEmployer),
        tax: '0',
        totalDeductions: fx(amounts.totalDeductions),
        netSalary: fx(amounts.netSalary),
        workedDays: ctx.workedDays,
        isEpfEnabled: ctx.isEpfEnabled,
        otHours: String(ctx.otHours),
        otAmount: fx(amounts.otAmount),
        salaryAdvance: toDecimal(ctx.salaryAdvance).toFixed(PREVIEW_DP),
        // basicPay is already pro-rated for unpaid leave (same as the saved salary), so it is
        // not shown as a separate deduction - preview and saved payslip match line for line
        nonPaidLeaveDeduction: '0',
        leaveDays: ctx.leaveDays,
        sickLeaveDays: ctx.sickLeaveDays,
        loanDeduction: toDecimal(ctx.loanDeduction).toFixed(PREVIEW_DP),
        epf8: fx(amounts.epfEmployee),
        epf12: fx(amounts.epfEmployer),
        etf3: fx(amounts.etfEmployer),
        paidLeave: applicableAnnualLeave(ctx.leaveDays, emp.paidLeave),
        dailyRate: fx(amounts.dailyRate),
        deductions: [
            { name: 'Salary Advance', amount: toDecimal(ctx.salaryAdvance).toFixed(PREVIEW_DP) },
            ...ctx.deductions.map((d) => ({ name: d.type, amount: toDecimal(d.amount).toFixed(PREVIEW_DP) })),
            ...ctx.loanInstallments.map((inst) => ({
                name: `Loan Installment: ${inst.loan?.loanTitle} (${ctx.ordinal(inst.installmentNumber)} installment)`,
                amount: installmentRemaining(inst),
            })),
        ],
        allowances: ctx.allowances.map((a) => ({ name: a.type, amount: toDecimal(a.amount).toFixed(PREVIEW_DP) })),
    };
}

/**
 * Deduction lines of a saved salary. Loan installments are stored as their own
 * deduction lines; the row's loan total is listed only for legacy rows without them.
 */
function savedDeductionLines(record: SalaryRecord): PayslipLine[] {
    const lines = (record.deductions || []).map((d) => ({ name: d.type, amount: d.amount }));
    const hasItemisedLoan = lines.some((d) => d.name.startsWith('Loan Installment'));
    return [
        ...(isPositive(record.salaryAdvance) ? [{ name: 'Salary Advance', amount: record.salaryAdvance }] : []),
        ...(!hasItemisedLoan && isPositive(record.loanDeduction) ? [{ name: 'Loan Installments', amount: record.loanDeduction }] : []),
        ...lines,
    ];
}

/** Payslip preview for a salary already saved in the backend. */
export function buildSavedDetails(record: SalaryRecord, companyWorkingDays: number): SalaryDetails {
    const basicSalary = record.basicSalary || '0';
    const salaryType = record.salaryType || 'DAILY';
    return {
        basicSalary,
        salaryType,
        basicPay: record.basicPay,
        epfEmployee: record.employeeEPF,
        epfEmployer: record.employerEPF,
        etfEmployer: record.etfAmount,
        // Stored figures: displayed as-is (gross − totalDeduction = netSalary)
        grossSalary: record.grossSalary,
        totalDeductions: record.totalDeduction,
        netSalary: record.netSalary,
        workedDays: record.workingDays,
        isEpfEnabled: isPositive(record.employeeEPF) || isPositive(record.employerEPF),
        otHours: record.otHours,
        otAmount: record.otAmount,
        salaryAdvance: record.salaryAdvance,
        // basicPay is already prorated for unpaid leave; it is not a separate stored deduction
        nonPaidLeaveDeduction: '0',
        leaveDays: record.leaveDays || 0,
        sickLeaveDays: record.sickLeaveDays || 0,
        loanDeduction: record.loanDeduction,
        epf8: record.employeeEPF,
        epf12: record.employerEPF,
        etf3: record.etfAmount,
        paidLeave: record.paidLeave || 0,
        dailyRate: calculateDailyRate(salaryType, basicSalary, companyWorkingDays).toFixed(PREVIEW_DP),
        deductions: savedDeductionLines(record),
        allowances: (record.allowances || []).map((a) => ({ name: a.type, amount: a.amount })),
    };
}
