/**
 * Salary / loan shapes returned by the API. Every money field (and otHours,
 * interestRate) is a decimal STRING per the API contract.
 */

export interface SalaryLineItem {
    id?: string;
    type: string;
    amount: string;
}

export interface SalaryRecord {
    id: string;
    month: number;
    year: number;
    workingDays: number;
    otHours: string;
    otAmount: string;
    salaryAdvance: string;
    basicPay: string;
    employeeEPF: string;
    employerEPF: string;
    etfAmount: string;
    employeeTaxAmount: string;
    employeeEPFRate?: string | null;
    employerEPFRate?: string | null;
    etfRate?: string | null;
    netSalary: string;
    createdAt: string;
    employeeId: string;
    companyId: string;
    allowanceTotal: string;
    deductionTotal: string;
    basicSalary: string;
    grossSalary: string;
    salaryType: 'DAILY' | 'MONTHLY';
    totalDeduction: string;
    loanDeduction: string;
    paidLeave: number;
    leaveDays: number;
    sickLeaveDays: number;
    /** Not persisted by the backend today; kept optional for forward compatibility. */
    nonPaidLeaveDeduction?: string;
    employee?: { fullName: string; employeeId: string };
    allowances?: SalaryLineItem[];
    deductions?: SalaryLineItem[];
}

export interface LoanInstallment {
    id: string;
    loanId: string;
    installmentNumber: number;
    dueDate: string;
    amount: string;
    paidAmount: string;
    status: string;
    salaryId?: string | null;
    updatedAt?: string;
    /** Interest part of the installment, when provided. */
    interest?: string;
    loan?: {
        id?: string;
        employeeId: string;
        loanTitle: string;
        loanId?: string;
    };
}

/** A money line on a payslip preview. */
export interface PayslipLine {
    name: string;
    amount: string;
}

/** Payslip preview model (money as decimal strings, day/hour counts as numbers). */
export interface SalaryDetails {
    salaryType: string;
    basicSalary: string;
    basicPay: string;
    epfEmployee: string;
    epfEmployer: string;
    etfEmployer: string;
    tax?: string;
    /**
     * Stored gross of a saved salary row. Present only for saved salaries; when
     * set, gross / totalDeductions / netSalary are the stored values and are
     * displayed as-is instead of being recomputed.
     */
    grossSalary?: string;
    totalDeductions: string;
    netSalary: string;
    workedDays: number;
    dailyRate: string;
    isEpfEnabled: boolean;
    otHours: string;
    otAmount: string;
    salaryAdvance: string;
    loanDeduction: string;
    paidLeave: number;
    epf8: string;
    epf12: string;
    etf3: string;
    allowances: PayslipLine[];
    deductions: PayslipLine[];
    leaveDays: number;
    sickLeaveDays: number;
    nonPaidLeaveDeduction: string;
}
