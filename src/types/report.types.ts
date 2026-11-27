/**
 * Report API response shapes (/reports/*). Per the API contract every money
 * field and computed total — and otHours — is a decimal STRING. Day/employee
 * counts stay numbers.
 */

export interface ReportLineItem {
    id?: string;
    type: string;
    amount: string;
}

/* ---------- GET /reports/company-payroll-summary ---------- */

export interface PayrollSummaryEmployee {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    /** EPF member number from the employee row (newer backends; null when not set). */
    epfNumber?: string | null;
    /** Current state of the employee; paid rows are reported whatever it is. */
    employeeStatus?: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
    workingDays: number;
    basicSalary: string;
    basicPay: string;
    epfEtfAmount?: string;
    otHours?: string;
    otAmount: string;
    grossPay: string;
    /** Stored salary-row gross (newer backends); fall back to grossPay. */
    grossSalary?: string;
    /** Stored salary-row total deduction (newer backends). */
    totalDeduction?: string;
    netPay: string;
    tax?: string;
    employeeEPF: string;
    employerEPF?: string;
    etfAmount?: string;
    salaryAdvance: string;
    companyEPFETF?: string;
    allowanceTotal?: string;
    deductionTotal?: string;
    salaryType?: 'DAILY' | 'MONTHLY';
}

export interface PayrollSummaryMonthTotals {
    totalEmployees: number;
    totalGrossPay: string;
    totalNetPay: string;
    totalEmployeeEPF: string;
    totalCompanyEPFETF: string;
    /** Legacy key: SUM OF RATES (basicSalary), not earned basic pay. */
    totalBasicPay?: string;
    totalBasicSalary?: string;
    /** Sum of earned (prorated) basic pay. */
    totalBasicPayEarned?: string;
    totalGrossSalary?: string;
    totalOtAmount?: string;
    totalTax?: string;
    totalSalaryAdvance?: string;
    totalDeductions?: string;
}

export interface PayrollSummaryMonth {
    year: number;
    month: string;
    monthNumber: number;
    status: 'Completed' | 'Pending';
    /** Draft salaries of the month: not approved yet, so not in any total. */
    pendingDrafts?: number;
    employees: PayrollSummaryEmployee[];
    totals: PayrollSummaryMonthTotals;
}

export interface PayrollSummaryOverallTotals {
    totalMonths: number;
    totalEmployees: number;
    /** Legacy key: SUM OF RATES (basicSalary), not earned basic pay. */
    totalBasicPay?: string;
    totalBasicSalary?: string;
    /** Sum of earned (prorated) basic pay. */
    totalBasicPayEarned?: string;
    totalGrossSalary?: string;
    totalOtAmount?: string;
    totalGrossPay: string;
    totalTax?: string;
    totalSalaryAdvance?: string;
    totalDeductions?: string;
    totalNetPay: string;
    totalEmployeeEPF: string;
    totalCompanyEPFETF: string;
    totalAllowance?: string;
    totalDeduction?: string;
}

export interface CompanyPayrollSummary {
    companyName: string;
    dateRange?: { startMonth: number; startYear: number; endMonth: number; endYear: number };
    monthlyData: PayrollSummaryMonth[];
    overallTotals: PayrollSummaryOverallTotals;
}

/* ---------- POST /reports/selected-employees-summary ---------- */

export interface SelectedSummaryEmployee {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    /** Days worked in the month (backend field name; 0 when no salary row exists). */
    workedDays: number;
    basicSalary: string;
    basicPay: string;
    otHours?: string;
    otAmount: string;
    grossPay: string;
    /** Stored salary-row gross (newer backends); fall back to grossPay. */
    grossSalary?: string;
    /** Stored salary-row total deduction (newer backends). */
    totalDeduction?: string;
    netPay: string;
    tax?: string;
    salaryAdvance: string;
    deductions: string;
    allowanceTotal?: string;
    employeeEPF: string;
    companyEPFETF: string;
}

export interface SelectedSummaryTotals {
    basicSalary?: string;
    basicPay: string;
    otAmount: string;
    grossPay: string;
    salaryAdvance: string;
    deductions: string;
    netPay: string;
    employeeEPF: string;
    companyEPFETF: string;
}

export interface SelectedEmployeesSummary {
    metadata: {
        employeeCount: number;
        datePeriod: string;
        department: string;
        reportType: string;
        totalGrossPay: string;
    };
    employees: SelectedSummaryEmployee[];
    totals: SelectedSummaryTotals;
}

/* ---------- GET /reports/employee-payroll-summary ---------- */

export interface EmployeeMonthlyRow {
    month: string;
    salaryType?: string;
    workedDays: number;
    companyWorkingDays?: number;
    leaveDays?: number;
    sickLeaveDays?: number;
    basicSalary?: string;
    basicPay: string;
    otHours: string;
    otAmount: string;
    grossPay: string;
    /** Stored salary-row gross (newer backends); fall back to grossPay. */
    grossSalary?: string;
    /** Stored salary-row total deduction (newer backends). */
    totalDeduction?: string;
    netPay: string;
    tax: string;
    salaryAdvance: string;
    deductions: string;
    employeeEPF: string;
    companyEPFETF: string;
    loanDeduction?: string;
    nonPaidLeaveDeduction?: string;
    allowances?: ReportLineItem[];
    customDeductions?: ReportLineItem[];
}

export interface EmployeeAnnualTotals {
    workedDays: number;
    basicPay: string;
    otAmount: string;
    grossPay: string;
    netPay: string;
    tax: string;
    salaryAdvance: string;
    deductions: string;
    employeeEPF: string;
    companyEPFETF: string;
}

export interface EmployeePayrollSummary {
    employeeName: string;
    employeeCode: string;
    designation: string;
    salaryType?: string;
    basicSalary: string;
    joinedDate: string;
    monthlyBreakdown: EmployeeMonthlyRow[];
    annualTotals: EmployeeAnnualTotals;
}

/* ---------- GET /reports/c-form ---------- */

export interface CFormRow {
    employeeName: string;
    nationalId: string;
    memberNo: string;
    basicPay: string;
    employerEpf: string;
    employeeEpf: string;
    totalEarnings: string;
}

export interface CFormReportData {
    companyName: string;
    month: number;
    year: number;
    monthName: string;
    epfRegistrationNo?: string;
    rows: CFormRow[];
    totals: {
        basicPay: string;
        employerEpf: string;
        employeeEpf: string;
        totalEarnings: string;
    };
}

/** One Bank Advice line (GET /reports/bank-advice): one per salary row of the month. */
export interface BankAdviceRow {
    id: string;
    employeeCode: string;
    fullName: string;
    accountHolderName: string;
    /** 'EMPLOYEE_NAME' when no bank holder name is saved (accountHolderName is then the employee name). */
    accountHolderNameSource?: 'BANK' | 'EMPLOYEE_NAME';
    bankName: string;
    branchName: string;
    accountNumber: string;
    /** Net salary, 2-dp decimal string. */
    amount: string;
    /** Current employee state; paid inactive/removed employees are still listed. */
    employeeStatus: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
}

export interface BankAdviceReportData {
    month: number;
    year: number;
    rows: BankAdviceRow[];
    totalAmount: string;
    /** Draft salaries of the month: not approved, so not in the transfer list. */
    pendingDrafts?: number;
}
