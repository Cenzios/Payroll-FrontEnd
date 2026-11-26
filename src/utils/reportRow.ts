import { sumBy } from './money';

/**
 * Report rows carry the figures stored on the salary row. The UI must display
 * them as-is and never recompute gross / deductions / net from the components.
 * Newer backends send `grossSalary` / `totalDeduction`; older ones only send
 * `grossPay` and `deductionTotal` / `deductions`, used as a fallback.
 */
export interface StoredSalaryFigures {
    grossSalary?: string;
    grossPay?: string;
    totalDeduction?: string;
    deductionTotal?: string;
    deductions?: string;
    netPay?: string;
}

/** Stored gross salary of a report row. */
export function rowGross(row: StoredSalaryFigures): string {
    return row.grossSalary ?? row.grossPay ?? '0';
}

/** Stored total deduction of a report row. */
export function rowDeduction(row: StoredSalaryFigures): string {
    return row.totalDeduction ?? row.deductionTotal ?? row.deductions ?? '0';
}

/** Stored net pay of a report row. */
export function rowNet(row: StoredSalaryFigures): string {
    return row.netPay ?? '0';
}

export interface SearchableRow {
    employeeName?: string;
    employeeCode?: string;
}

/** Case-insensitive match on employee name or code (empty query matches all). */
export function matchesEmployeeSearch(row: SearchableRow, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (q === '') return true;
    const name = row.employeeName?.toLowerCase() ?? '';
    const code = row.employeeCode?.toLowerCase() ?? '';
    return name.includes(q) || code.includes(q);
}

export interface SummaryRow extends StoredSalaryFigures {
    basicPay: string;
    otAmount: string;
    employeeEPF: string;
    salaryAdvance: string;
    companyEPFETF?: string;
}

export interface RowTotals {
    totalEmployees: number;
    totalBasicPay: string;
    totalOtAmount: string;
    totalGrossPay: string;
    totalDeductions: string;
    totalNetPay: string;
    totalEmployeeEPF: string;
    totalCompanyEPFETF: string;
    totalSalaryAdvance: string;
}

/** Totals over a set of report rows (sums of the stored per-row values). */
export function sumRows(rows: readonly SummaryRow[]): RowTotals {
    const fixed = (pick: (row: SummaryRow) => string | undefined): string => sumBy(rows, pick).toFixed(2);
    return {
        totalEmployees: rows.length,
        totalBasicPay: fixed((r) => r.basicPay),
        totalOtAmount: fixed((r) => r.otAmount),
        totalGrossPay: fixed(rowGross),
        totalDeductions: fixed(rowDeduction),
        totalNetPay: fixed(rowNet),
        totalEmployeeEPF: fixed((r) => r.employeeEPF),
        totalCompanyEPFETF: fixed((r) => r.companyEPFETF),
        totalSalaryAdvance: fixed((r) => r.salaryAdvance),
    };
}
