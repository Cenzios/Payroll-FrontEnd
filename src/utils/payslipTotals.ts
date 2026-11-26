import type Decimal from 'decimal.js';
import type { SalaryDetails } from '../types/salary.types';
import { formatMoney, sumBy, toDecimal } from './money';

/**
 * "Loan Deduction" is the salary row's loan total. Saved salaries already list
 * every loan installment as its own deduction line, so this line is never
 * shown or summed separately.
 */
export const LOAN_TOTAL_LINE = 'Loan Deduction';

export interface PayslipTotals {
    gross: Decimal;
    deductions: Decimal;
    net: Decimal;
}

/** True when the payslip shows a salary already saved (stored figures available). */
export function isStoredPayslip(p: SalaryDetails): boolean {
    return p.grossSalary !== undefined;
}

/**
 * Gross / deductions / net of a payslip. A saved salary uses the stored row
 * values as-is; an unsaved preview is derived from its lines.
 */
export function payslipTotals(p: SalaryDetails): PayslipTotals {
    if (p.grossSalary !== undefined) {
        return {
            gross: toDecimal(p.grossSalary),
            deductions: toDecimal(p.totalDeductions),
            net: toDecimal(p.netSalary),
        };
    }
    // Earned (pro-rated) basic pay for every salary type, as the backend stores it
    const gross = toDecimal(p.basicPay)
        .plus(toDecimal(p.otAmount))
        .plus(sumBy(p.allowances, (a) => a.amount));
    const deductions = toDecimal(p.nonPaidLeaveDeduction)
        .plus(p.isEpfEnabled ? toDecimal(p.epf8) : 0)
        .plus(sumBy(p.deductions.filter((d) => d.name !== LOAN_TOTAL_LINE), (d) => d.amount));
    return { gross, deductions, net: toDecimal(p.netSalary) };
}

export interface PayslipLineView {
    label: string;
    amount: string;
}

/**
 * The basic earnings line. Daily staff: rate × days. Monthly staff (preview and
 * saved alike): the pro-rated basic pay that goes into gross.
 */
export function payslipBasicLine(p: SalaryDetails): PayslipLineView {
    if (p.salaryType === 'DAILY') {
        return {
            label: `Daily Wage Earnings (${formatMoney(p.basicSalary)} × ${p.workedDays})`,
            amount: p.basicPay,
        };
    }
    if (!toDecimal(p.basicPay).equals(toDecimal(p.basicSalary))) {
        return { label: `Basic Pay (monthly salary ${formatMoney(p.basicSalary)})`, amount: p.basicPay };
    }
    return { label: 'Monthly Basic Salary', amount: p.basicPay };
}
