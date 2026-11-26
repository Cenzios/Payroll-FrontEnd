import Decimal from 'decimal.js';
import { MoneyInput, ZERO, sumBy, sumCentsBy, toCents, toDecimal } from './money';

/**
 * Client-side salary PREVIEW maths (the backend recomputes and is the source
 * of truth when saving). All money arithmetic is done with decimal.js; the
 * formulas mirror the previous number-based implementation exactly.
 */

const EPF_EMPLOYEE_RATE = new Decimal('0.08');
const EPF_EMPLOYER_RATE = new Decimal('0.12');
const ETF_EMPLOYER_RATE = new Decimal('0.03');

export interface AmountEntry {
    amount: MoneyInput;
}

export interface SalaryEmployeeInput {
    basicSalary: MoneyInput;
    salaryType?: 'DAILY' | 'MONTHLY';
    paidLeave?: number;
    otRate: MoneyInput;
    epfEnabled: boolean;
    epfEtfAmount?: MoneyInput;
}

export interface SalaryPeriodInput {
    companyWorkingDays: number;
    workedDays: number;
    leaveDays: number;
    sickLeaveDays: number;
    otHours: MoneyInput;
}

export interface PayslipInput extends SalaryPeriodInput {
    salaryAdvance: MoneyInput;
    isEpfEnabled: boolean;
    /** Already gated by "loan enabled". */
    loanDeduction: MoneyInput;
    allowances: readonly AmountEntry[];
    deductions: readonly AmountEntry[];
}

export interface PayslipAmounts {
    basicPay: Decimal;
    otAmount: Decimal;
    allowanceTotal: Decimal;
    deductionTotal: Decimal;
    nonPaidLeaveDeduction: Decimal;
    epfEmployee: Decimal;
    epfEmployer: Decimal;
    etfEmployer: Decimal;
    totalDeductions: Decimal;
    netSalary: Decimal;
    dailyRate: Decimal;
}

/** Annual leave actually paid this month (capped by the employee's balance). */
export function applicableAnnualLeave(leaveDays: number, paidLeave: number | undefined): number {
    return Math.min(leaveDays, paidLeave || 0);
}

/** OT amount = hours × rate (0 when the employee has no OT rate). */
export function calculateOtAmount(otRate: MoneyInput, otHours: MoneyInput): Decimal {
    const rate = toDecimal(otRate);
    return rate.greaterThan(0) ? toDecimal(otHours).times(rate) : ZERO;
}

/** Basic pay for the payable days (worked + paid annual leave). */
export function calculateBasicPay(emp: SalaryEmployeeInput, period: SalaryPeriodInput): Decimal {
    const basic = toDecimal(emp.basicSalary);
    const payableDays = period.workedDays + applicableAnnualLeave(period.leaveDays, emp.paidLeave);
    if (emp.salaryType === 'MONTHLY') {
        if (period.companyWorkingDays <= 0) return ZERO;
        return basic
            .dividedBy(period.companyWorkingDays)
            .times(Math.min(payableDays, period.companyWorkingDays));
    }
    return basic.times(payableDays);
}

/** Per-day rate shown on the payslip. */
export function calculateDailyRate(salaryType: string | undefined, basicSalary: MoneyInput, companyWorkingDays: number): Decimal {
    const basic = toDecimal(basicSalary);
    if (salaryType !== 'MONTHLY') return basic;
    return companyWorkingDays > 0 ? basic.dividedBy(companyWorkingDays) : ZERO;
}

/** Informational unpaid-leave amount (monthly employees only). */
export function calculateNonPaidLeaveDeduction(
    salaryType: string | undefined,
    basicSalary: MoneyInput,
    companyWorkingDays: number,
    sickLeaveDays: number,
): Decimal {
    if (salaryType !== 'MONTHLY' || companyWorkingDays <= 0) return ZERO;
    return toDecimal(basicSalary).dividedBy(companyWorkingDays).times(sickLeaveDays);
}

/** EPF basis is the configured epfEtfAmount only (no fallback to basic). */
export function epfBasis(epfEtfAmount: MoneyInput): Decimal {
    const basis = toDecimal(epfEtfAmount);
    return basis.greaterThan(0) ? basis : ZERO;
}

export function calculateEmployeeEpf(emp: SalaryEmployeeInput, isEpfEnabled: boolean): Decimal {
    const basis = epfBasis(emp.epfEtfAmount);
    return emp.epfEnabled && isEpfEnabled && basis.greaterThan(0) ? basis.times(EPF_EMPLOYEE_RATE) : ZERO;
}

/**
 * Full payslip preview used by the Salary page (generate / save). Same rounding policy as
 * the backend: every component is rounded to cents (half-up) and gross / deductions / net
 * are derived from the rounded components, so the preview matches the saved salary.
 */
export function calculatePayslip(emp: SalaryEmployeeInput, input: PayslipInput): PayslipAmounts {
    const basicPay = toCents(calculateBasicPay(emp, input));
    const otAmount = toCents(calculateOtAmount(emp.otRate, input.otHours));
    const allowanceTotal = sumCentsBy(input.allowances, (a) => a.amount);
    const deductionTotal = sumCentsBy(input.deductions, (d) => d.amount);

    const basis = epfBasis(emp.epfEtfAmount);
    const epfOn = emp.epfEnabled && input.isEpfEnabled && basis.greaterThan(0);
    const epfEmployee = epfOn ? toCents(basis.times(EPF_EMPLOYEE_RATE)) : ZERO;
    const epfEmployer = epfOn ? toCents(basis.times(EPF_EMPLOYER_RATE)) : ZERO;
    const etfEmployer = epfOn ? toCents(basis.times(ETF_EMPLOYER_RATE)) : ZERO;

    const tax = ZERO; // Tax will be calculated by backend
    const totalDeductions = epfEmployee
        .plus(tax)
        .plus(toCents(input.salaryAdvance))
        .plus(deductionTotal)
        .plus(toCents(input.loanDeduction));
    const netSalary = basicPay.plus(otAmount).plus(allowanceTotal).minus(totalDeductions);

    return {
        basicPay,
        otAmount,
        allowanceTotal,
        deductionTotal,
        nonPaidLeaveDeduction: calculateNonPaidLeaveDeduction(
            emp.salaryType, emp.basicSalary, input.companyWorkingDays, input.sickLeaveDays,
        ),
        epfEmployee,
        epfEmployer,
        etfEmployer,
        totalDeductions,
        netSalary,
        dailyRate: calculateDailyRate(emp.salaryType, emp.basicSalary, input.companyWorkingDays),
    };
}

/**
 * Validation check used before enabling "generate": would the net salary be
 * negative? (Kept identical to the previous rule, which applies 8% EPF on the
 * basic pay rather than on epfEtfAmount.)
 */
export function wouldNetSalaryBeNegative(emp: SalaryEmployeeInput, input: PayslipInput): boolean {
    const basicPay = calculateBasicPay(emp, input);
    const otAmount = calculateOtAmount(emp.otRate, input.otHours);
    const epfAmount = emp.epfEnabled && input.isEpfEnabled ? basicPay.times(EPF_EMPLOYEE_RATE) : ZERO;
    const totalEarnings = basicPay.plus(otAmount).plus(sumBy(input.allowances, (a) => a.amount));
    const otherDeductions = epfAmount
        .plus(toDecimal(input.loanDeduction))
        .plus(sumBy(input.deductions, (d) => d.amount));
    return totalEarnings.minus(otherDeductions.plus(toDecimal(input.salaryAdvance))).lessThan(0);
}

/** Earnings ceiling for the "manage deductions" modal. */
export function calculateEarningsLimit(
    emp: SalaryEmployeeInput,
    period: SalaryPeriodInput,
    allowances: readonly AmountEntry[],
): Decimal {
    const otAmount = calculateOtAmount(emp.otRate, period.otHours);
    const totalAllowances = sumBy(allowances, (a) => a.amount);
    const base = emp.salaryType === 'MONTHLY'
        ? toDecimal(emp.basicSalary)
        : toDecimal(emp.basicSalary).times(
            period.workedDays + applicableAnnualLeave(period.leaveDays, emp.paidLeave),
        );
    return base.plus(otAmount).plus(totalAllowances);
}
