import Decimal from 'decimal.js';
import type { Employee } from '../types/employee.types';
import type { SalaryRecord } from '../types/salary.types';
import { MoneyInput, ZERO, sumBy, toDecimal } from './money';
import {
    AmountEntry,
    applicableAnnualLeave,
    calculateNonPaidLeaveDeduction,
    calculatePayslip,
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

/** A generated salary: show the stored gross / total deduction / net as-is. */
function storedCardFigures(saved: SalaryRecord): SalaryCardFigures {
    return {
        otAmount: toDecimal(saved.otAmount),
        totalAllowances: sumBy(saved.allowances, (item) => item.amount),
        customDeductions: sumBy(saved.deductions, (item) => item.amount),
        epfAmount: toDecimal(saved.employeeEPF),
        totalEarnings: toDecimal(saved.grossSalary),
        totalDeductions: toDecimal(saved.totalDeduction),
        netSalary: toDecimal(saved.netSalary),
    };
}

/** Employee EPF of an unsaved salary: the same pro-rated, gross-capped rule the API saves. */
function unsavedEmployeeEpf(input: SalaryCardInput): Decimal {
    return calculatePayslip(input.emp, {
        companyWorkingDays: input.companyWorkingDays,
        workedDays: input.workedDays,
        leaveDays: input.leaveDays,
        sickLeaveDays: input.sickLeaveDays,
        otHours: input.otHours,
        salaryAdvance: input.salaryAdvance,
        isEpfEnabled: input.isEpfEnabled,
        loanDeduction: '0',
        allowances: input.allowances,
        deductions: input.deductions,
    }).epfEmployee;
}

export function computeSalaryCardFigures(input: SalaryCardInput): SalaryCardFigures {
    const { emp, saved } = input;
    if (saved && saved.grossSalary != null && saved.totalDeduction != null) {
        return storedCardFigures(saved);
    }
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
    const epfAmount = saved ? toDecimal(saved.employeeEPF) : unsavedEmployeeEpf(input);

    // Unsaved: same breakdown the backend stores - the basic pay is pro-rated for the
    // payable days (unpaid leave is already out of it), so there is no separate unpaid-leave
    // deduction and gross matches the saved payslip.
    // Legacy saved rows (no stored gross): previous display (full basic + unpaid-leave line).
    const baseForEarnings = !saved || emp.salaryType === 'DAILY'
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
        totalDeductions = advance.plus(epfAmount).plus(loan).plus(customDeductions).plus(saved ? unpaidLeave : ZERO);
    }

    const netSalary = saved ? toDecimal(saved.netSalary) : totalEarnings.minus(totalDeductions);

    return { otAmount, totalAllowances, customDeductions, epfAmount, totalEarnings, totalDeductions, netSalary };
}
