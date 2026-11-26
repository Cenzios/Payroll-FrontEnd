import Decimal from 'decimal.js';
import type { Employee } from '../types/employee.types';
import type { SalaryRecord } from '../types/salary.types';
import { MoneyInput, ZERO, sumBy, toDecimal } from './money';
import {
    AmountEntry,
    applicableAnnualLeave,
    calculateEmployeeEpf,
    calculateNonPaidLeaveDeduction,
} from './salaryCalc';

/**
 * Figures shown on an EmployeeSalaryCard (Salary page). Mirrors the previous
 * number-based logic but with decimal.js; when a salary was already generated
 * (`saved`), the stored values are shown.
 */
export interface SalaryCardInput {
    emp: Employee;
    saved?: SalaryRecord;
    workedDays: number;
    otHours: number;
    salaryAdvance: MoneyInput;
    leaveDays: number;
    sickLeaveDays: number;
    loanDeduction: MoneyInput;
    companyWorkingDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    hasLoanInstallment: boolean;
    allowances: readonly AmountEntry[];
    deductions: readonly AmountEntry[];
}

export interface SalaryCardFigures {
    otAmount: Decimal;
    totalAllowances: Decimal;
    customDeductions: Decimal;
    epfAmount: Decimal;
    totalEarnings: Decimal;
    totalDeductions: Decimal;
    netSalary: Decimal;
}

function displayBasicPay(input: SalaryCardInput, workedDays: number): Decimal {
    const { emp, saved, companyWorkingDays, leaveDays } = input;
    if (saved) return toDecimal(saved.basicPay);
    const basic = toDecimal(emp.basicSalary);
    const payable = workedDays + applicableAnnualLeave(leaveDays, emp.paidLeave);
    if (emp.salaryType === 'MONTHLY') {
        return companyWorkingDays > 0
            ? basic.dividedBy(companyWorkingDays).times(Math.min(payable, companyWorkingDays))
            : basic;
    }
    return basic.times(payable);
}

function nonPaidLeave(input: SalaryCardInput): Decimal {
    const { emp, saved, companyWorkingDays, sickLeaveDays } = input;
    if (saved) {
        if (saved.nonPaidLeaveDeduction != null) return toDecimal(saved.nonPaidLeaveDeduction);
        const basis = toDecimal(saved.basicSalary).isZero() ? emp.basicSalary : saved.basicSalary;
        return calculateNonPaidLeaveDeduction(
            emp.salaryType, basis, companyWorkingDays, saved.sickLeaveDays || sickLeaveDays || 0,
        );
    }
    return calculateNonPaidLeaveDeduction(emp.salaryType, emp.basicSalary, companyWorkingDays, sickLeaveDays);
}

export function computeSalaryCardFigures(input: SalaryCardInput): SalaryCardFigures {
    const { emp, saved } = input;
    const workedDays = saved ? saved.workingDays : input.workedDays;
    const advance = toDecimal(saved ? saved.salaryAdvance : input.salaryAdvance);

    const otAmount = saved
        ? toDecimal(saved.otAmount)
        : toDecimal(input.otHours).times(toDecimal(emp.otRate));
    const totalAllowances = saved
        ? sumBy(saved.allowances, (item) => item.amount)
        : sumBy(input.allowances, (item) => item.amount);
    const customDeductions = saved
        ? sumBy(saved.deductions, (item) => item.amount)
        : sumBy(input.deductions, (item) => item.amount);

    const unpaidLeave = nonPaidLeave(input);
    const epfAmount = saved ? toDecimal(saved.employeeEPF) : calculateEmployeeEpf(emp, input.isEpfEnabled);

    // Monthly: always the full basic salary in gross earnings; daily: rate × days.
    const baseForEarnings = emp.salaryType === 'DAILY'
        ? displayBasicPay(input, workedDays)
        : toDecimal(emp.basicSalary);
    const totalEarnings = baseForEarnings.plus(otAmount).plus(totalAllowances);

    let totalDeductions: Decimal;
    if (saved && saved.totalDeduction != null) {
        totalDeductions = toDecimal(saved.totalDeduction).plus(unpaidLeave);
    } else {
        const loan = saved
            ? toDecimal(saved.loanDeduction)
            : input.hasLoanInstallment && input.isLoanEnabled ? toDecimal(input.loanDeduction) : ZERO;
        totalDeductions = advance.plus(epfAmount).plus(loan).plus(customDeductions).plus(unpaidLeave);
    }

    const netSalary = saved ? toDecimal(saved.netSalary) : totalEarnings.minus(totalDeductions);

    return { otAmount, totalAllowances, customDeductions, epfAmount, totalEarnings, totalDeductions, netSalary };
}
