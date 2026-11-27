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

/**
 * EPF/ETF base for the month (same rule as the API): epfEtfAmount pro-rated by the share of
 * the month that is paid - min(payable days, company working days) / company working days,
 * i.e. basicPay / basicSalary for monthly staff - capped at gross earnings, rounded to cents.
 * 0 paid days gives 0.
 */
export function epfBasis(
    emp: SalaryEmployeeInput,
    period: SalaryPeriodInput,
    grossEarnings: Decimal,
): Decimal {
    const amount = toDecimal(emp.epfEtfAmount);
    const payableDays = period.workedDays + applicableAnnualLeave(period.leaveDays, emp.paidLeave);
    if (!amount.greaterThan(0) || period.companyWorkingDays <= 0 || payableDays <= 0) return ZERO;
    const paidShare = new Decimal(Math.min(payableDays, period.companyWorkingDays))
        .dividedBy(period.companyWorkingDays);
    const basis = toCents(Decimal.min(amount.times(paidShare), grossEarnings));
    return basis.greaterThan(0) ? basis : ZERO;
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

    const grossEarnings = basicPay.plus(otAmount).plus(allowanceTotal);
    const basis = epfBasis(emp, input, grossEarnings);
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
    const netSalary = grossEarnings.minus(totalDeductions);

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
 * Validation check used before enabling "generate": is the net that calculatePayslip (and
 * the API, which rejects a negative net with 422) computes below 0? Same maths, so it blocks
 * exactly the negative cases.
 */
export function wouldNetSalaryBeNegative(emp: SalaryEmployeeInput, input: PayslipInput): boolean {
    return calculatePayslip(emp, input).netSalary.lessThan(0);
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

export interface SalaryLimitInput {
    employeeStatus?: string;
    salaryType?: string;
    companyWorkingDays: number;
    workedDays: number;
    leaveDays: number;
    sickLeaveDays: number;
    otHours: MoneyInput;
}

/**
 * The day / hour / status limits the API enforces with 422 (salaryRules.ts), so Generate is
 * blocked for the same requests. Returns the first violated rule's message, or null.
 */
export function salaryLimitError(input: SalaryLimitInput): string | null {
    const companyDays = input.companyWorkingDays;
    if (input.employeeStatus !== undefined && input.employeeStatus !== 'ACTIVE') {
        return 'Salary can only be generated for active employees';
    }
    const days: [string, number][] = [
        ['Worked days', input.workedDays],
        ['Leave days', input.leaveDays],
        ['Sick leave days', input.sickLeaveDays],
    ];
    const outOfRange = days.find(([, value]) => value < 0 || value > companyDays);
    if (outOfRange) {
        return `${outOfRange[0]} must be between 0 and the company working days (${companyDays})`;
    }
    const totalDays = input.workedDays + input.leaveDays + input.sickLeaveDays;
    if (input.salaryType === 'DAILY' && totalDays > companyDays) {
        return `Worked days + leave + sick leave (${totalDays}) cannot exceed the company working days (${companyDays}) for daily-paid staff`;
    }
    if (toDecimal(input.otHours).lessThan(0)) return 'OT hours cannot be negative';
    return null;
}
