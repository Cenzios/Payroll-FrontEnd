import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Decimal from "decimal.js";
import type { SalaryDetails } from "../types/salary.types";
import type { EmployeeAnnualTotals, EmployeeMonthlyRow, SelectedSummaryEmployee, SelectedSummaryTotals } from "../types/report.types";
import { formatMoney, formatRs, MoneyInput, toChartNumber, toDecimal } from "./money";
import { rowDeduction, rowGross, rowNet, sumRows } from "./reportRow";
import { LOAN_TOTAL_LINE, payslipBasicLine, payslipTotals } from "./payslipTotals";

// --- Types ---

// Money fields are decimal strings (API contract); all arithmetic uses decimal.js.

export interface Allowance {
    name: string;
    amount: string;
}

export interface Deduction {
    name: string;
    amount: string;
}

/** Payslip export input: the same model the PayslipPreview renders. */
export type PayslipData = SalaryDetails;

export interface Employee {
    id: string;
    fullName: string;
    employeeId: string;
    designation: string;
}

export interface ReportEmployee {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    workingDays: number;
    basicSalary: string;
    basicPay: string;
    otAmount: string;
    otHours?: string;
    grossPay: string;
    /** Stored salary-row gross / total deduction (newer backends). */
    grossSalary?: string;
    totalDeduction?: string;
    deductionTotal?: string;
    employeeEPF: string;
    salaryAdvance: string;
    netPay: string;
    tax?: string;
    deductions?: string;
    companyEPFETF?: string;
    salaryType?: string;
    loanDeduction?: string;
    allowances?: Allowance[];
    customDeductions?: Deduction[];
}

export interface MonthData {
    month: string;
    year: number;
    monthNumber: number;
    employees: ReportEmployee[];
}

export interface EmployeeModalReportData {
    companyName: string;
    companyAddress: string;
    employeeName: string;
    employeeId: string;
    month: number;
    year: number;
    basicSalary: string;
    totalAllowances: string;
    grossPay: string;
    totalDeductions: string;
    netPay: string;
    workedDays: number;
    salaryType: string;
    otHours: string;
    otAmount: string;
    epf8: string;
    loanDeduction: string;
    salaryAdvance: string;
}

// --- Helper Functions ---

/** 2-decimal money display ("1,234.50"). */
const formatCurrency = (amount: MoneyInput): string => formatMoney(amount);

/** Money with the shared currency prefix ("Rs. 1,234.50"). */
const rs = (amount: MoneyInput): string => formatRs(amount);

/** Numeric spreadsheet cell (xlsx needs a JS number). */
const xlsNum = (amount: MoneyInput): number => toChartNumber(amount);

/** Payslip gross earnings (stored value for saved salaries). */
const payslipGross = (p: PayslipData): Decimal => payslipTotals(p).gross;

/** Payslip total deductions (stored value for saved salaries). */
const payslipDeductions = (p: PayslipData): Decimal => payslipTotals(p).deductions;

/** Deduction lines shown on a payslip (the row's loan total is never listed twice). */
const payslipDeductionLines = (p: PayslipData): PayslipData["deductions"] =>
    p.deductions.filter((d) => d.name !== LOAN_TOTAL_LINE && toDecimal(d.amount).greaterThan(0));

/** Excel header for the basic rate column: daily staff carry a day rate, monthly staff a monthly salary. */
const basicRateLabel = (e: ReportEmployee): string =>
    e.salaryType === "DAILY" ? "Daily rate" : e.salaryType === "MONTHLY" ? "Monthly salary" : "";

// --- Export Functions ---

export const exportEmployeeModalReport = (data: EmployeeModalReportData) => {
    const doc = new jsPDF();
    const {
        companyName,
        companyAddress,
        employeeName,
        employeeId,
        month,
        year,
        basicSalary,
        totalAllowances,
        grossPay,
        totalDeductions,
        netPay,
        workedDays,
        salaryType,
        otHours,
        otAmount,
        epf8,
        loanDeduction,
        salaryAdvance
    } = data;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Background (Base Dark Blue)
    doc.setFillColor(16, 24, 54);
    doc.rect(0, 0, pageWidth, 50, "F");

    // Top Middle Circle
    doc.setFillColor(23, 42, 106);
    doc.circle(150, 40, 40, "F");

    // Top Corner Circle
    doc.setFillColor(7, 27, 80);
    doc.circle(190, 30, 40, "F");

    // Fill background color for everything below header to be super light/white
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

    // Yellow vertical line
    doc.setFillColor(252, 163, 17);
    doc.rect(14, 10, 1, 30, "F");

    // Left Header Texts
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CenzPayroll", 19, 13);

    doc.setTextColor(252, 163, 17);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Payroll Summary Report", 19, 26);

    // Format month and year as 'January 2026'
    // month is 1-indexed from backend, so month - 1 for JS Date
    const periodStr = new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

    doc.setTextColor(180, 180, 180);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Here's your Payroll History • ${periodStr}`, 19, 36);

    // Right Header Texts
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const companyLines = doc.splitTextToSize(companyName, 80);
    doc.text(companyLines, pageWidth - 14, 20, { align: "right" });

    if (companyAddress) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        const addressLines = doc.splitTextToSize(companyAddress, 80);
        doc.text(addressLines, pageWidth - 14, 20 + (companyLines.length * 6), { align: "right" });
    }

    // 2. OVERVIEW BANNER (Light Blue Background)
    let currentY = 56;
    doc.setFillColor(243, 246, 253); // Light Blue background
    doc.rect(14, currentY, pageWidth - 28, 12, "F");

    doc.setTextColor(23, 44, 108); // Dark Blue text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE PAYROLL OVERVIEW", 20, currentY + 8);

    doc.setTextColor(60, 100, 200); // Blue text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${employeeId} • ${employeeName}`, pageWidth - 20, currentY + 8, { align: "right" });

    // 3. SUMMARY BOXES
    currentY += 18;
    const boxWidth = (pageWidth - 28) / 5;
    const boxHeight = 18;
    doc.setDrawColor(220, 225, 235); // Light Gray Border
    doc.setLineWidth(0.3);

    const summaries = [
        { label: "Basic Salary", value: `${rs(basicSalary)}` },
        { label: "Total Allowances", value: `${rs(totalAllowances)}` },
        { label: "Gross Pay", value: `${rs(grossPay)}` },
        { label: "Total Deduction", value: `${rs(totalDeductions)}` },
        { label: "Net Pay", value: formatCurrency(netPay) }
    ];

    summaries.forEach((summary, index) => {
        const startX = 14 + (index * boxWidth);
        // Draw Box
        doc.setDrawColor(220, 225, 235);
        if (index > 0) {
            doc.line(startX, currentY, startX, currentY + boxHeight); // Inner vertical line
        }

        doc.rect(14, currentY, pageWidth - 28, boxHeight, "S"); // Overall outer border

        // Label
        doc.setTextColor(150, 160, 180); // Gray
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(summary.label, startX + 4, currentY + 6);

        // Value
        doc.setTextColor(30, 30, 30); // Dark
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(summary.value, startX + 4, currentY + 14);
    });

    // 4. PAYROLL BREAKDOWN TABLE
    currentY += 26;

    // Table Header
    doc.setFillColor(33, 60, 133); // #213c85 Deep blue background
    doc.rect(14, currentY, pageWidth - 28, 12, "F");

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payroll Breakdown", 18, currentY + 8);

    currentY += 12;

    // Sub-header Component | Units | Rate (Rs) | Amount (Rs)
    doc.setFillColor(248, 250, 252); // Very light grey
    doc.rect(14, currentY, pageWidth - 28, 10, "F");

    doc.setTextColor(30, 40, 70);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Component", 18, currentY + 6.5);
    doc.text("Units", 100, currentY + 6.5, { align: "center" });
    doc.text("Rate (Rs.)", 140, currentY + 6.5, { align: "center" });
    doc.text("Amount (Rs.)", pageWidth - 18, currentY + 6.5, { align: "right" });

    currentY += 10;

    const drawRow = (component: string, units: string, rate: string, amount: string, isLast: boolean = false) => {
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        // Add minimal padding
        doc.text(component, 18, currentY + 7.5);
        doc.text(units, 100, currentY + 7.5, { align: "center" });
        doc.text(rate, 140, currentY + 7.5, { align: "center" });

        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(amount, pageWidth - 18, currentY + 7.5, { align: "right" });

        currentY += 12;

        if (!isLast) {
            doc.setDrawColor(240, 240, 240); // Light dashed-like or solid line
            doc.setLineWidth(0.2);
            doc.line(14, currentY, pageWidth - 14, currentY);
        }
    };

    // Calculate a daily rate if needed
    const dailyRateStr = salaryType === 'MONTHLY'
        ? formatMoney(toDecimal(basicSalary).dividedBy(workedDays || 1))
        : formatMoney(basicSalary);
    const otHoursDivisor = toDecimal(otHours).isZero() ? new Decimal(1) : toDecimal(otHours);

    // Draw Rows based on image design
    drawRow("Basic salary", `${workedDays} days`, dailyRateStr, formatMoney(basicSalary));
    drawRow("Overtime", `${otHours} hrs`, formatMoney(toDecimal(otAmount).dividedBy(otHoursDivisor)), formatMoney(otAmount));
    drawRow("Employee EPF deduction", "8%", "0.00", formatMoney(epf8));
    drawRow("Loan deduction", "—", "—", formatMoney(loanDeduction));
    drawRow("Advance deduction", "—", "—", formatMoney(salaryAdvance), true);

    // Draw total table boundary
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.rect(14, currentY - (5 * 12), pageWidth - 28, (5 * 12), "S");

    // 5. TOTAL ROW (Dark Blue Background)
    doc.setFillColor(15, 26, 78); // #0f1a4e Deep blue
    doc.rect(14, currentY, pageWidth - 28, 12, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Net Pay", 18, currentY + 8);

    doc.setTextColor(252, 163, 17);
    doc.text(`${rs(netPay)}`, pageWidth - 18, currentY + 8, { align: "right" });

    // 6. FOOTER
    doc.setFillColor(16, 24, 54);
    doc.rect(0, pageHeight - 16, pageWidth, 16, "F");

    doc.setTextColor(106, 130, 175);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const footerText = `Generated by CenzPayroll • Product by Cenzios Pvt Ltd • Year: ${year} • Month: ${new Date(year, month - 1).toLocaleString("default", { month: "long" })}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: "center" });

    doc.save(`Payroll_Report_${employeeId}.pdf`);
};

export const exportPayslip = (
    format: "pdf" | "excel" | "csv",
    data: {
        previewPayslip: PayslipData;
        selectedEmployee: Employee;
        companyName: string;
        companyAddress?: string;
        selectedMonth: number;
        selectedYear: number;
        companyWorkingDays: number;
        title?: string;
    }
) => {
    const {
        previewPayslip,
        selectedEmployee,
        companyName,
        companyAddress,
        selectedMonth,
        selectedYear,
        companyWorkingDays,
        title = "Pay Slip",
    } = data;

    if (format === "pdf") {
        const doc = new jsPDF();
        const periodStr = new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" });

        // 1. Header Background (Dark Rect at top)
        doc.setFillColor(16, 24, 54); // #101836
        doc.rect(0, 0, 210, 45, "F");

        // Simulated curves in header
        doc.setFillColor(23, 42, 106);
        doc.circle(210, 10, 70, "F");
        doc.setFillColor(7, 27, 80);
        doc.circle(240, 20, 65, "F");

        // Vertical accent line
        doc.setFillColor(252, 163, 17);
        doc.rect(14, 10, 1, 26, "F");

        // Clip overflow: Draw white rect over everything below the header
        doc.setFillColor(255, 255, 255); // white
        doc.rect(0, 45, 210, 252, "F");

        // Header Texts - Left
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzPayroll", 18, 13);

        doc.setTextColor(252, 163, 17);
        doc.setFontSize(26);
        doc.text(title, 18, 25);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(`• Month: ${periodStr}`, 18, 33);

        // Header Texts - Right
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const companyLines = doc.splitTextToSize(companyName, 80);
        // align correctly by calculating offset or just relying on right align
        doc.text(companyLines, 196, 18, { align: "right" });

        if (companyAddress) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(180, 180, 180);
            const addressLines = doc.splitTextToSize(companyAddress, 80);
            doc.text(addressLines, 196, 18 + (companyLines.length * 6), { align: "right" });
        }

        // 2. EMPLOYEE DETAILS Section
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("EMPLOYEE DETAILS", 14, 60);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(14, 65, 196, 65);

        // Details Grid
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text("Employee Name", 14, 70);
        doc.text("Employee No", 75, 70);
        doc.text("Designation", 125, 70);
        doc.text("Month", 175, 70);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(selectedEmployee.fullName, 14, 76);
        doc.text(selectedEmployee.employeeId, 75, 76);

        const designation = selectedEmployee.designation || "-";
        const desigLines = doc.splitTextToSize(designation, 40);
        doc.text(desigLines, 125, 76);
        doc.text(periodStr, 175, 76);

        // 3. EARNINGS Section
        // doc.setTextColor(100, 100, 100);
        // doc.setFontSize(9);
        // doc.setFont("helvetica", "bold");
        // doc.text("EARNINGS", 14, 92);

        let currentY = 90;

        // doc.setDrawColor(200, 200, 200);
        // doc.setLineWidth(0.2);
        // doc.line(14, currentY, 196, currentY);
        // currentY += 6;

        // doc.setFontSize(9);
        // doc.setFont("helvetica", "bold");
        // doc.setTextColor(0, 0, 0);
        // doc.text("Description", 14, currentY);
        // doc.text("Amount (Rs.)", 196, currentY, { align: "right" });

        // currentY += 4;
        // doc.setLineWidth(0.2);
        // doc.setDrawColor(200, 200, 200);
        // doc.setLineDash([0.8, 0.8], 0);
        // doc.line(14, currentY, 196, currentY);
        // doc.setLineDash([], 0);
        // currentY += 8;

        const addRow = (desc: string, val: string, isBold: boolean = false) => {
            if (isBold) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
            } else {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(60, 60, 60);
            }
            doc.text(desc, 14, currentY);

            doc.text(val, 196, currentY, { align: "right" });
            currentY += 7;
        };

        addRow("Salary Type", previewPayslip.salaryType);
        // addRow("Basic Rate", formatCurrency(previewPayslip.basicSalary));

        addRow("Working Days", companyWorkingDays.toString());
        addRow("Worked Days", previewPayslip.workedDays.toString());

        if (previewPayslip.salaryType === "MONTHLY" && previewPayslip.leaveDays > 0) {
            addRow("Paid Leave Count", previewPayslip.leaveDays.toString());
        }
        if (previewPayslip.salaryType === "MONTHLY" && (previewPayslip.sickLeaveDays || 0) > 0) {
            addRow("Unpaid Leave Count", previewPayslip.sickLeaveDays.toString());
        }

        currentY += 4;

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("EARNINGS", 14, currentY);
        currentY += 5;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Description", 14, currentY);
        doc.text("Amount (Rs.)", 196, currentY, { align: "right" });

        currentY += 4;
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.setLineDash([0.8, 0.8], 0);
        doc.line(14, currentY, 196, currentY);
        doc.setLineDash([], 0);
        currentY += 8;

        const basicLine = payslipBasicLine(previewPayslip);
        addRow(basicLine.label, formatCurrency(basicLine.amount));

        if (toDecimal(previewPayslip.otAmount).greaterThan(0)) {
            addRow(`OT Amount (${previewPayslip.otHours} hrs)`, formatCurrency(previewPayslip.otAmount));
        }

        (previewPayslip.allowances || []).forEach(a => {
            addRow(a.name, formatCurrency(a.amount));
        });

        // Gross Earnings End Line
        currentY += 1;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;

        const gross = payslipGross(previewPayslip);
        addRow("Gross Earnings", formatCurrency(gross), true);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(14, currentY, 196, currentY);

        // 4. DEDUCTIONS SECTION
        currentY += 10;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("DEDUCTIONS", 14, currentY);

        currentY += 4;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Description", 14, currentY);
        doc.text("Amount (Rs.)", 196, currentY, { align: "right" });

        currentY += 4;
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.setLineDash([0.8, 0.8], 0);
        doc.line(14, currentY, 196, currentY);
        doc.setLineDash([], 0);
        currentY += 8;

        if (toDecimal(previewPayslip.nonPaidLeaveDeduction).greaterThan(0)) {
            addRow("Unpaid Leave Deduction", formatCurrency(previewPayslip.nonPaidLeaveDeduction));
        }
        if (previewPayslip.isEpfEnabled) {
            addRow("EPF Employee (8%)", formatCurrency(previewPayslip.epf8));
        }
        // if (previewPayslip.loanDeduction > 0) {
        //     addRow("Loan Installment", formatCurrency(previewPayslip.loanDeduction));
        // }
        payslipDeductionLines(previewPayslip).forEach(d => {
            addRow(d.name, formatCurrency(d.amount));
        });

        currentY += 1;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;

        const totalDeductions = payslipDeductions(previewPayslip);
        addRow("Total Deductions", formatCurrency(totalDeductions), true);
        // addRow("Total Deductions", formatCurrency(previewPayslip.totalDeductions), true);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(14, currentY, 196, currentY);

        // 5. NET SALARY BOX
        currentY += 10;
        doc.setFillColor(16, 24, 54); // Match top header color
        doc.rect(14, currentY, 182, 14, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("NET SALARY", 20, currentY + 9);

        const amountStr = formatCurrency(payslipTotals(previewPayslip).net);
        const amountWidth = doc.getTextWidth(amountStr);

        doc.setTextColor(255, 255, 255);
        doc.text("", 190 - amountWidth, currentY + 9, { align: "right" });
        doc.setTextColor(252, 163, 17);
        doc.text(amountStr, 190, currentY + 9, { align: "right" });

        // 6. BOTTOM FOOTER
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(16, 24, 54);
        doc.rect(0, pageHeight - 15, 210, 15, "F");

        doc.setTextColor(106, 130, 175);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated by CenzPayroll - Product by Cenzios Pvt Ltd - Year: ${selectedYear} - Month: ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short" })}`, 105, pageHeight - 6, { align: "center" });

        doc.setFillColor(180, 180, 180);
        doc.rect(184, pageHeight - 10, 12, 5, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Page 1/1", 190, pageHeight - 6.5, { align: "center" });

        doc.save(`Payslip_${selectedEmployee.employeeId}.pdf`);
    } else if (format === "excel" || format === "csv") {
        const wsData = [
            [companyName.toUpperCase()],
            [
                `${title.toUpperCase()} - ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })} `,
            ],
            [],
            ["Employee Name", selectedEmployee.fullName],
            ["Employee No", selectedEmployee.employeeId],
            ["Designation", selectedEmployee.designation],
            [],
            ["Worked Days", companyWorkingDays],
            ["Worked Days", previewPayslip.workedDays],
            ...(previewPayslip.salaryType === "MONTHLY" && previewPayslip.leaveDays > 0 ? [["Paid Leave", previewPayslip.leaveDays]] : []),
            [],
            ["EARNINGS", "Amount (Rs.)"],
            ["Salary Type", previewPayslip.salaryType],
            [previewPayslip.salaryType === "DAILY" ? "Daily Rate" : "Monthly Basic Salary", xlsNum(previewPayslip.basicSalary)],
            ["Basic Pay (earned)", xlsNum(previewPayslip.basicPay)],
            ...(toDecimal(previewPayslip.otAmount).greaterThan(0)
                ? [
                    [
                        `OT Amount(${previewPayslip.otHours} hrs)`,
                        xlsNum(previewPayslip.otAmount),
                    ],
                ]
                : []),
            ...(previewPayslip.allowances || []).map((a) => [a.name, xlsNum(a.amount)]),
            [
                "Gross Earnings",
                xlsNum(payslipGross(previewPayslip)),
            ],
            [],
            ["DEDUCTIONS", "Amount (Rs.)"],
            ...(previewPayslip.isEpfEnabled
                ? [["EPF Employee (8%)", xlsNum(previewPayslip.epf8)]]
                : []),
            ...(toDecimal(previewPayslip.nonPaidLeaveDeduction).greaterThan(0)
                ? [["Unpaid Leave Deduction", xlsNum(previewPayslip.nonPaidLeaveDeduction)]]
                : []),
            ...payslipDeductionLines(previewPayslip).map((d) => [d.name, xlsNum(d.amount)]),
            [
                "Total Deductions",
                xlsNum(payslipDeductions(previewPayslip)),
            ],
            [],
            ["NET SALARY PAYABLE", xlsNum(payslipTotals(previewPayslip).net)],
            [],
            ...(previewPayslip.isEpfEnabled
                ? [
                    ["EMPLOYER CONTRIBUTIONS", "Amount (Rs.)"],
                    ["EPF Employer (12%)", xlsNum(previewPayslip.epf12)],
                    ["ETF Employer (3%)", xlsNum(previewPayslip.etf3)],
                ]
                : []),
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Payslip");
            XLSX.writeFile(wb, `Payslip_${selectedEmployee.employeeId}.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Payslip_${selectedEmployee.employeeId}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export const exportPayrollSummaryReport = (
    format: "pdf" | "excel" | "csv",
    data: {
        companyName: string;
        companyAddress: string;
        monthlyData: MonthData[];
        startMonth: number;
        startYear: number;
        endMonth: number;
        endYear: number;
        overallTotals: {
            totalBasicPayEarned: string;
            totalGrossPay: string;
            totalEmployeeEPF: string;
            totalSalaryAdvance: string;
            totalNetPay: string;
            totalDeductions?: string;
        };
        /** Set when the exported rows are a search-filtered subset. */
        filterLabel?: string;
    }
) => {
    const {
        companyName,
        companyAddress,
        monthlyData,
        startMonth,
        startYear,
        endMonth,
        endYear,
        overallTotals,
        filterLabel
    } = data;
    const fileSuffix = filterLabel ? "_Filtered" : "";
    const dateRangeText = `${new Date(startYear, startMonth).toLocaleString("default", { month: "long", year: "numeric" })} - ${new Date(endYear, endMonth).toLocaleString("default", { month: "long", year: "numeric" })} `;

    if (format === "pdf") {
        const doc = new jsPDF();
        const startPeriodStr = new Date(startYear, startMonth).toLocaleString("default", { month: "long", year: "numeric" });
        const endPeriodStr = new Date(endYear, endMonth).toLocaleString("default", { month: "long", year: "numeric" });
        const periodStr = `${startPeriodStr} - ${endPeriodStr}`;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header Background (Base Dark Blue with 2 Circles)
        doc.setFillColor(16, 24, 54);
        doc.rect(0, 0, pageWidth, 50, "F");

        doc.setFillColor(23, 42, 106);
        doc.circle(150, 40, 40, "F");

        doc.setFillColor(7, 27, 80);
        doc.circle(190, 30, 40, "F");

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

        // Yellow vertical line
        doc.setFillColor(252, 163, 17);
        doc.rect(14, 10, 1, 30, "F");

        // Left Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzPayroll", 19, 13);

        doc.setTextColor(252, 163, 17);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Payroll Summary Report", 19, 26);

        const isSingleMonth = startMonth === endMonth && startYear === endYear;

        doc.setTextColor(180, 180, 180);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        // doc.text(`Here's your Payroll History • ${periodStr}`, 19, 36);
        doc.text(`Here's your Payroll History • ${isSingleMonth ? endPeriodStr : periodStr}`, 19, 36);
        if (filterLabel) {
            doc.setTextColor(252, 163, 17);
            doc.setFontSize(8);
            doc.text(`${filterLabel} - totals cover the listed employees only`, 19, 43);
        }

        // Right Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const companyLines = doc.splitTextToSize(companyName, 80);
        doc.text(companyLines, pageWidth - 14, 20, { align: "right" });

        if (companyAddress) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(180, 180, 180);
            const addressLines = doc.splitTextToSize(companyAddress, 80);
            doc.text(addressLines, pageWidth - 14, 20 + (companyLines.length * 6), { align: "right" });
        }

        // 2. OVERVIEW BANNER
        let currentY = 56;
        doc.setFillColor(243, 246, 253);
        doc.rect(14, currentY, pageWidth - 28, 12, "F");

        doc.setTextColor(23, 44, 108);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        // doc.text("MULTI-MONTH PAYROLL OVERVIEW", 20, currentY + 8);
        doc.text(isSingleMonth ? "SINGLE-MONTH PAYROLL OVERVIEW" : "MULTI-MONTH PAYROLL OVERVIEW", 20, currentY + 8);

        doc.setTextColor(100, 110, 140);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${isSingleMonth ? "Month" : "Period"}: ${isSingleMonth ? endPeriodStr : periodStr}`, pageWidth - 20, currentY + 8, { align: "right" });

        // 3. PERIOD SUMMARY Section
        currentY += 18;
        doc.setFillColor(16, 24, 54); // Match header color
        doc.rect(14, currentY, pageWidth - 28, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const periodRange = startYear === endYear
            ? `${shortMonths[startMonth]} - ${shortMonths[endMonth]} ${endYear}`
            : `${shortMonths[startMonth]} ${startYear} - ${shortMonths[endMonth]} ${endYear}`;
        doc.text(`Period Summary ( ${periodRange} )`, 20, currentY + 5.5);

        // Summary Boxes
        currentY += 8;
        const boxWidth = (pageWidth - 28) / 5;
        const boxHeight = 18;
        const summaries = [
            { label: "Total Basic Pay", value: `${rs(overallTotals.totalBasicPayEarned)}` },
            { label: "Total Gross", value: `${rs(overallTotals.totalGrossPay)}` },
            { label: "Total EPF (8%)", value: `${rs(overallTotals.totalEmployeeEPF)}` },
            { label: "Total Deductions", value: `${rs(overallTotals.totalDeductions ?? "0")}` },
            { label: "Total Net Pay", value: `${rs(overallTotals.totalNetPay)}`, isNet: true }
        ];

        summaries.forEach((box, i) => {
            const startX = 14 + (i * boxWidth);
            doc.setDrawColor(220, 225, 235);
            doc.setLineWidth(0.3);
            doc.rect(startX, currentY, boxWidth, boxHeight, "S");

            doc.setTextColor(150, 160, 180);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(box.label, startX + 4, currentY + 6);

            doc.setTextColor(box.isNet ? 60 : 30, box.isNet ? 100 : 30, box.isNet ? 200 : 30);
            doc.setFontSize(box.isNet ? 11 : 10);
            doc.setFont("helvetica", "bold");
            doc.text(box.value, startX + 4, currentY + 13);
        });

        // 4. MONTHLY TABLES
        currentY += 30;
        monthlyData.forEach((monthData: MonthData) => {
            if (monthData.employees.length === 0) return;

            // Check for new page
            if (currentY + 40 > pageHeight) {
                doc.addPage();
                currentY = 20;
            }

            // Month Heading
            doc.setFillColor(16, 24, 54);
            doc.rect(14, currentY, pageWidth - 28, 10, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${monthData.month} ${monthData.year}`, 20, currentY + 6.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
doc.text(`${monthData.employees.length} ${monthData.employees.length === 1 ? "Employee" : "Employees"}`, pageWidth - 20, currentY + 6.5, { align: "right" });            currentY += 10;

            const tableBody = monthData.employees.map((emp: ReportEmployee) => [
                emp.employeeCode || "-",
                emp.employeeName || "-",
                emp.workingDays,
                formatCurrency(emp.basicPay),
                formatCurrency(emp.otAmount),
                formatCurrency(rowGross(emp)),
                formatCurrency(emp.employeeEPF),
                formatCurrency(rowDeduction(emp)),
                formatCurrency(rowNet(emp)),
            ]);

            // Monthly totals: sums of the stored per-row values
            const m = sumRows(monthData.employees);

            tableBody.push([
                "", "Monthly Total", "",
                formatCurrency(m.totalBasicPayEarned),
                formatCurrency(m.totalOtAmount),
                formatCurrency(m.totalGrossPay),
                formatCurrency(m.totalEmployeeEPF),
                formatCurrency(m.totalDeductions),
                formatCurrency(m.totalNetPay)
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [["Emp ID", "Name", "Worked Days", "Basic Pay", "OT", "Gross", "EPF (8%)", "Deductions", "Net Pay"]],
                body: tableBody,
                theme: "plain",
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [243, 246, 253], textColor: [23, 44, 108], fontStyle: "bold" },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 38 },
                    2: { cellWidth: 18, halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.column.index >= 2) {
                        data.cell.styles.halign = 'right';
                    }

                    if (data.row.index === tableBody.length - 1) {
                        data.cell.styles.fillColor = [22, 28, 45]; // Dark background for total
                        data.cell.styles.textColor = [255, 184, 0]; // Yellow text
                        data.cell.styles.fontStyle = "bold";
                    }
                },
                margin: { left: 14, right: 14 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        });

        // 5. FOOTER
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(16, 24, 54);
            doc.rect(0, pageHeight - 16, pageWidth, 16, "F");
            doc.setTextColor(106, 130, 175);
            doc.setFontSize(8);
            doc.text(`Generated by CenzPayroll • Product by Cenzios Pvt Ltd • Year: ${new Date().getFullYear()} • Month: ${new Date().toLocaleString('default', { month: 'long' })}`, pageWidth / 2, pageHeight - 6, { align: "center" });
            doc.text(`Page ${i} / ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
        }

        doc.save(`Payroll_Summary_Report${fileSuffix}.pdf`);
    } else {
        const wsData: any[] = [["Payroll Summary Report"], [dateRangeText], ...(filterLabel ? [[filterLabel]] : []), []];

        monthlyData.forEach((monthData: MonthData) => {
            if (monthData.employees.length === 0) return;

            wsData.push([`${monthData.month} ${monthData.year} `]);
            wsData.push([
                "Emp ID",
                "Name",
                "Days",
                "Basic Rate (monthly salary / daily rate)",
                "Rate Type",
                "Basic Pay (earned)",
                "OT Amount",
                "Gross Pay",
                "EPF (8%)",
                "Salary Advance",
                "Total Deductions",
                "Net Pay",
            ]);

            monthData.employees.forEach((emp: ReportEmployee) => {
                wsData.push([
                    emp.employeeCode || "-",
                    emp.employeeName || "-",
                    emp.workingDays,
                    xlsNum(emp.basicSalary),
                    basicRateLabel(emp),
                    xlsNum(emp.basicPay),
                    xlsNum(emp.otAmount),
                    xlsNum(rowGross(emp)),
                    xlsNum(emp.employeeEPF),
                    xlsNum(emp.salaryAdvance),
                    xlsNum(rowDeduction(emp)),
                    xlsNum(rowNet(emp)),
                ]);
            });
            const m = sumRows(monthData.employees);
            wsData.push([
                "", "Monthly Total", "", "", "",
                xlsNum(m.totalBasicPayEarned),
                xlsNum(m.totalOtAmount),
                xlsNum(m.totalGrossPay),
                xlsNum(m.totalEmployeeEPF),
                xlsNum(m.totalSalaryAdvance),
                xlsNum(m.totalDeductions),
                xlsNum(m.totalNetPay),
            ]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, `Payroll_Summary_Report${fileSuffix}.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Payroll_Summary_Report${fileSuffix}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export const exportEmployeeMonthlySummary = (
    format: "pdf" | "excel" | "csv",
    data: {
        employeeName: string;
        employeeCode: string;
        designation: string;
        basicSalary: string;
        joinedDate: string;
        monthlyBreakdown: EmployeeMonthlyRow[];
        annualTotals: EmployeeAnnualTotals;
    }
) => {
    const {
        employeeName,
        employeeCode,
        designation,
        basicSalary,
        joinedDate,
        monthlyBreakdown,
        annualTotals,
    } = data;

    if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PAYROLL SUMMARY REPORT", 14, 15);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        let yPos = 30;

        doc.text(`Employee Name: ${employeeName} `, 14, yPos);
        doc.text(`Employee ID: ${employeeCode} `, 120, yPos);
        yPos += 7;

        doc.text(`Position: ${designation} `, 14, yPos);
        doc.text(`Basic Salary: ${rs(basicSalary)} `, 120, yPos);
        yPos += 7;

        doc.text(`Joined Date: ${joinedDate} `, 14, yPos);
        yPos += 10;

        const tableData = monthlyBreakdown.map((row) => [
            row.month,
            row.workedDays.toString(),
            `${rs(row.basicPay)} `,
            `${rs(row.otAmount)} (${row.otHours}h)`,
            `${rs(rowGross(row))} `,
            `${rs(row.netPay)} `,
            `${rs(row.salaryAdvance)} `,
            `${rs(rowDeduction(row))} `,
            `${rs(row.employeeEPF)} `,
            `${rs(row.companyEPFETF)} `,
        ]);

        tableData.push([
            "SELECTED MONTH TOTALS",
            annualTotals.workedDays.toString(),
            `${rs(annualTotals.basicPay)} `,
            `${rs(annualTotals.otAmount)} `,
            `${rs(annualTotals.grossPay)} `,
            `${rs(annualTotals.netPay)} `,
            `${rs(annualTotals.salaryAdvance)} `,
            `${rs(annualTotals.deductions)} `,
            `${rs(annualTotals.employeeEPF)} `,
            `${rs(annualTotals.companyEPFETF)} `,
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [
                [
                    "Month",
                    "Days",
                    "Basic",
                    "OT",
                    "Gross",
                    "Net",
                    "Advance",
                    "Total Ded.",
                    "EPF 8%",
                    "EPF/ETF Comp",
                ],
            ],
            body: tableData,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [37, 99, 235], fontStyle: "bold" },
            footStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fillColor = [59, 130, 246];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });

        doc.save(`${employeeCode} _Payroll_Summary.pdf`);
    } else {
        const wsData: any[][] = [
            ["PAYROLL SUMMARY REPORT"],
            [],
            ["Employee Name:", employeeName, "", "Employee ID:", employeeCode],
            [
                "Position:",
                designation,
                "",
                "Basic Salary:",
                `${rs(basicSalary)} `,
            ],
            ["Joined Date:", joinedDate],
            [],
            ["Monthly Breakdown"],
            [
                "Month",
                "Days",
                "Basic",
                "OT",
                "Gross",
                "Net",
                "Advance",
                "Total Ded.",
                "EPF 8%",
                "EPF/ETF Comp",
            ],
            ...monthlyBreakdown.map((row) => [
                row.month,
                row.workedDays,
                xlsNum(row.basicSalary),
                xlsNum(row.otAmount),
                xlsNum(rowGross(row)),
                xlsNum(row.netPay),
                xlsNum(row.salaryAdvance),
                xlsNum(rowDeduction(row)),
                xlsNum(row.employeeEPF),
                xlsNum(row.companyEPFETF),
            ]),
            [
                "TOTALS",
                annualTotals.workedDays,
                xlsNum(annualTotals.basicPay),
                xlsNum(annualTotals.otAmount),
                xlsNum(annualTotals.grossPay),
                xlsNum(annualTotals.netPay),
                "",
                xlsNum(annualTotals.deductions),
                xlsNum(annualTotals.employeeEPF),
                xlsNum(annualTotals.companyEPFETF),
            ],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
            XLSX.writeFile(wb, `${employeeCode} _Payroll_Summary.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${employeeCode} _Payroll_Summary.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export const exportAllEmployeesSummary = (
    format: "pdf" | "excel" | "csv",
    data: {
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
) => {
    const { metadata, employees, totals } = data;

    if (format === "pdf") {
        const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("ALL EMPLOYEES – PAYROLL SUMMARY REPORT", 14, 15);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        let yPos = 30;

        doc.text(`Employee Count: ${metadata.employeeCount} `, 14, yPos);
        doc.text(`Date Period: ${metadata.datePeriod} `, 100, yPos);
        yPos += 7;
        doc.text(`Department: ${metadata.department} `, 14, yPos);
        doc.text(`Report Type: ${metadata.reportType} `, 100, yPos);
        yPos += 7;
        doc.text(
            `Total Gross Pay: ${rs(metadata.totalGrossPay)} `,
            14,
            yPos
        );
        yPos += 15;

        const tableData = employees.map((emp) => [
            emp.employeeCode,
            emp.employeeName,
            emp.workedDays.toString(),
            `${rs(emp.basicSalary)} `,
            `${rs(emp.otAmount)} (${emp.otHours || 0}h)`,
            `${rs(rowGross(emp))} `,
            `${rs(emp.salaryAdvance)} `,
            `${rs(rowDeduction(emp))} `,
            `${rs(emp.netPay)} `,
        ]);

        tableData.push([
            "TOTAL AMOUNTS",
            "",
            "",
            `${rs(totals.basicSalary ?? totals.basicPay)} `,
            `${rs(totals.otAmount)} `,
            `${rs(totals.grossPay)} `,
            `${rs(totals.salaryAdvance)} `,
            `${rs(totals.deductions)} `,
            `${rs(totals.netPay)} `,
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [
                [
                    "Emp ID",
                    "Name",
                    "Days",
                    "Basic Salary",
                    "OT",
                    "Gross",
                    "Advance",
                    "Total Ded.",
                    "Net Pay",
                ],
            ],
            body: tableData,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [31, 41, 55], fontStyle: "bold" },
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fillColor = [37, 99, 235];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });

        doc.save(
            `Selected_Employees_Payroll_Summary_${metadata.datePeriod.replace(" ", "_")}.pdf`
        );
    } else {
        const wsData: any[][] = [
            ["ALL EMPLOYEES – PAYROLL SUMMARY REPORT"],
            [],
            [
                "Employee Count:",
                metadata.employeeCount,
                "",
                "Date Period:",
                metadata.datePeriod,
            ],
            [
                "Department:",
                metadata.department,
                "",
                "Report Type:",
                metadata.reportType,
            ],
            ["Total Gross Pay:", `${rs(metadata.totalGrossPay)} `],
            [],
            ["Breakdown Table"],
            [
                "Emp ID",
                "Name",
                "Days",
                "Basic",
                "OT",
                "Gross",
                "Advance",
                "Total Ded.",
                "Net Pay",
            ],
            ...employees.map((emp) => [
                emp.employeeCode,
                emp.employeeName,
                emp.workedDays,
                xlsNum(emp.basicSalary),
                xlsNum(emp.otAmount),
                xlsNum(rowGross(emp)),
                xlsNum(emp.salaryAdvance),
                xlsNum(rowDeduction(emp)),
                xlsNum(emp.netPay),
            ]),
            [
                "TOTAL AMOUNTS",
                "",
                "",
                xlsNum(totals.basicPay),
                xlsNum(totals.otAmount),
                xlsNum(totals.grossPay),
                xlsNum(totals.salaryAdvance),
                xlsNum(totals.deductions),
                xlsNum(totals.netPay),
            ],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
            XLSX.writeFile(
                wb,
                `Selected_Employees_Summary_${metadata.datePeriod.replace(" ", "_")}.xlsx`
            );
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Selected_Employees_Summary_${metadata.datePeriod.replace(" ", "_")}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export interface BankAdviceReportData {
    companyName: string;
    companyAddress: string;
    reportData: {
        employeeCode: string;
        fullName: string;
        accountHolderName: string;
        bankName: string;
        branchName: string;
        accountNumber: string;
        amount: string;
    }[];
    month: number;
    year: number;
    totalAmount: string;
}

export const exportBankAdviceReport = (
    format: "pdf" | "excel" | "csv",
    data: BankAdviceReportData
) => {
    const { companyName, companyAddress, reportData, month, year, totalAmount } = data;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthName = months[month];
    const periodStr = `Year: ${year} • Month: ${monthName}`;

    if (format === "pdf") {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header (Standard Dark Blue with Circles)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 50, "F");

        doc.setFillColor(28, 48, 120);
        doc.circle(150, 40, 40, "F");

        doc.setFillColor(13, 26, 80);
        doc.circle(190, 30, 40, "F");

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

        // Yellow vertical line
        doc.setFillColor(255, 184, 0);
        doc.rect(14, 10, 1, 30, "F");

        // Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzPayroll", 19, 13);

        doc.setTextColor(255, 184, 0);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Bank Advice Report", 19, 26);

        doc.setTextColor(180, 180, 180);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Employee Bank Payment Details • ${periodStr}`, 19, 36);

        // Right Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const companyLines = doc.splitTextToSize(companyName, 80);
        doc.text(companyLines, pageWidth - 14, 20, { align: "right" });

        if (companyAddress) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(180, 180, 180);
            const addressLines = doc.splitTextToSize(companyAddress, 80);
            doc.text(addressLines, pageWidth - 14, 20 + (companyLines.length * 6), { align: "right" });
        }

        // 2. Table
        let currentY = 60;
        doc.setFillColor(33, 60, 133);
        doc.rect(14, currentY, pageWidth - 28, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Bank Details Summary", 20, currentY + 6.5);
        currentY += 10;

        const tableBody = reportData.map(item => [
            item.employeeCode,
            item.fullName,
            item.bankName,
            item.branchName,
            item.accountNumber,
            `${rs(item.amount)}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [["Employee ID", "Employee Name", "Bank Name", "Branch", "Account Number", "Total Amount"]],
            body: tableBody,
            theme: "plain",
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [243, 246, 253], textColor: [23, 44, 108], fontStyle: "bold" },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 40 },
                2: { cellWidth: 35 },
                3: { cellWidth: 28 },
                4: { cellWidth: 28 },
                5: { cellWidth: 31, halign: 'right', fontStyle: 'bold' }
            },

            didParseCell: (data) => {
                if (data.section === "head" && data.column.index === 5) {
                    data.cell.styles.halign = "right";
                }
            },
    
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY;

        // Total Row
        doc.setFillColor(15, 23, 42);
        doc.rect(14, currentY, pageWidth - 28, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Total Net Pay", 20, currentY + 6.5);
        doc.setTextColor(255, 184, 0);
        doc.text(`${rs(totalAmount)}`, pageWidth - 20, currentY + 6.5, { align: "right" });

        currentY += 25;

        // 3. Approved By Section
        if (currentY + 40 > pageHeight - 20) {
            doc.addPage();
            currentY = 30;
        }

        const boxWidth = 60;
        const boxHeight = 35;
        const startX = pageWidth - boxWidth - 14;

        doc.setFillColor(248, 250, 255);
        doc.rect(startX, currentY, boxWidth, boxHeight, "F");

        doc.setTextColor(120, 140, 180);
        doc.setFontSize(8);
        doc.text("Approved By", startX + boxWidth / 2, currentY + boxHeight / 2, { align: "center" });

        doc.setDrawColor(210, 220, 240);
        doc.setLineWidth(0.2);
        doc.line(startX + 5, currentY + boxHeight - 10, startX + boxWidth - 5, currentY + boxHeight - 10);

        doc.text("Name / Designation", startX + boxWidth / 2, currentY + boxHeight - 5, { align: "center" });

        // Footer
        for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) {
            doc.setPage(i);
            doc.setFillColor(15, 26, 40);
            doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7);
            doc.text(`Generated by CenzPayroll • Product by Cenzios Pvt Ltd • Year: ${year} • Month: ${monthName}`, pageWidth / 2, pageHeight - 6, { align: "center" });
        }

        doc.save(`Bank_Advice_Report_${monthName}_${year}.pdf`);
    } else {
        const wsData: any[][] = [
            ["Bank Advice Report"],
            [periodStr],
            [],
            ["Employee ID", "Employee Name", "Bank Name", "Branch", "Account Number", "Amount"]
        ];

        reportData.forEach(item => {
            wsData.push([
                item.employeeCode,
                item.fullName,
                item.bankName,
                item.branchName,
                item.accountNumber,
                xlsNum(item.amount)
            ]);
        });

        wsData.push([]);
        wsData.push(["", "", "", "", "Total Net Pay", xlsNum(totalAmount)]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bank Advice");
            XLSX.writeFile(wb, `Bank_Advice_Report_${monthName}_${year}.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Bank_Advice_Report_${monthName}_${year}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export interface EpfEtfReportData {
    companyName: string;
    companyAddress: string;
    reportData: {
        employeeId: string;
        employeeCode: string;
        fullName: string;
        epfNo: string;
        basicSalary: string;
        empEpf: string;
        employerEpf: string;
        etf: string;
        totalContribution: string;
    }[];
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    totals: {
        count: number;
        basicSalary: string;
        empEpf: string;
        employerEpf: string;
        etf: string;
        totalContribution: string;
    };
}

export const exportEpfEtfReport = (
    format: "pdf" | "excel" | "csv",
    data: EpfEtfReportData
) => {
    const { companyName, companyAddress, reportData, startMonth, startYear, endMonth, endYear, totals } = data;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let periodStr = "";
    if (startMonth === endMonth && startYear === endYear) {
        periodStr = `Year: ${startYear} • Month: ${months[startMonth]}`;
    } else {
        periodStr = `Period: ${months[startMonth]} ${startYear} - ${months[endMonth]} ${endYear}`;
    }

    if (format === "pdf") {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header (Standard Dark Blue with Circles)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 50, "F");

        doc.setFillColor(28, 48, 120);
        doc.circle(150, 40, 40, "F");

        doc.setFillColor(13, 26, 80);
        doc.circle(190, 30, 40, "F");

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

        // Yellow vertical line
        doc.setFillColor(255, 184, 0);
        doc.rect(14, 10, 1, 30, "F");

        // Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzPayroll", 19, 13);

        doc.setTextColor(255, 184, 0);
        doc.setFontSize(18);
        doc.text("EPF / ETF Summary Report", 19, 28);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(200, 200, 200);
        doc.text(`Employee Provident & Trust Fund Contributions • ${periodStr}`, 19, 36);

        // Company Details (Right side)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(companyName, pageWidth - 14, 20, { align: "right" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(200, 200, 200);
        if (companyAddress) {
            const splitAddress = doc.splitTextToSize(companyAddress, 60);
            doc.text(splitAddress, pageWidth - 14, 28, { align: "right" });
        }

        // 2. Table
        const tableBody = reportData.map(item => [
            item.employeeCode,
            item.fullName,
            item.epfNo,
            formatCurrency(item.basicSalary),
            formatCurrency(item.empEpf),
            formatCurrency(item.employerEpf),
            formatCurrency(item.etf),
            formatCurrency(item.totalContribution)
        ]);

        // Add Total row to table body
        tableBody.push([
            "", "Total", "",
            formatCurrency(totals.basicSalary),
            formatCurrency(totals.empEpf),
            formatCurrency(totals.employerEpf),
            formatCurrency(totals.etf),
            formatCurrency(totals.totalContribution)
        ]);

        autoTable(doc, {
            startY: 60,
            head: [["Employee ID", "Employee Name", "EPF No", "Basic Salary", "Emp EPF (8%)", "Employer EPF (12%)", "ETF (3%)", "Total Contribution"]],
            body: tableBody,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [243, 246, 253], textColor: [23, 44, 108], fontStyle: "bold" },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 35 },
                2: { cellWidth: 25 },
                3: { halign: "right" },
                4: { halign: "right" },
                5: { halign: "right" },
                6: { halign: "right" },
                7: { halign: "right", fontStyle: "bold", textColor: [43, 116, 255] }
            },
            didParseCell: (data) => {
                if (data.section === "head" && data.column.index >= 3) {
                    data.cell.styles.halign = "right";
                }
                if (data.row.index === tableBody.length - 1) {
                    data.cell.styles.fillColor = [15, 23, 42];
                    data.cell.styles.textColor = [255, 184, 0];
                    data.cell.styles.fontStyle = "bold";
                }
            },
            margin: { left: 14, right: 14 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // 3. Summary Boxes
        const boxWidth = (pageWidth - 28 - 15) / 4;
        const boxHeight = 20;

        // Emp EPF
        doc.setFillColor(252, 252, 252);
        doc.setDrawColor(240, 240, 240);
        doc.rect(14, finalY, boxWidth, boxHeight, "FD");
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.text("EMPLOYEE EPF (8%)", 14 + boxWidth / 2, finalY + 6, { align: "center" });
        doc.setTextColor(23, 44, 108);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${rs(totals.empEpf)}`, 14 + boxWidth / 2, finalY + 14, { align: "center" });

        // Employer EPF
        doc.setFillColor(252, 252, 252);
        doc.rect(14 + boxWidth + 5, finalY, boxWidth, boxHeight, "FD");
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("EMPLOYER EPF (12%)", 14 + boxWidth + 5 + boxWidth / 2, finalY + 6, { align: "center" });
        doc.setTextColor(23, 44, 108);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${rs(totals.employerEpf)}`, 14 + boxWidth + 5 + boxWidth / 2, finalY + 14, { align: "center" });

        // ETF
        doc.setFillColor(252, 252, 252);
        doc.rect(14 + (boxWidth + 5) * 2, finalY, boxWidth, boxHeight, "FD");
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("ETF (3%)", 14 + (boxWidth + 5) * 2 + boxWidth / 2, finalY + 6, { align: "center" });
        doc.setTextColor(23, 44, 108);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${rs(totals.etf)}`, 14 + (boxWidth + 5) * 2 + boxWidth / 2, finalY + 14, { align: "center" });

        // Total
        doc.setFillColor(43, 116, 255);
        doc.rect(14 + (boxWidth + 5) * 3, finalY, boxWidth, boxHeight, "F");
        doc.setTextColor(230, 230, 230);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("TOTAL CONTRIBUTION", 14 + (boxWidth + 5) * 3 + boxWidth / 2, finalY + 6, { align: "center" });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${rs(totals.totalContribution)}`, 14 + (boxWidth + 5) * 3 + boxWidth / 2, finalY + 14, { align: "center" });

        // 4. Approved By Box
        const sigY = finalY + 35;
        doc.setFillColor(248, 250, 255);
        doc.rect(pageWidth - 64, sigY, 50, 25, "F");
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Approved By", pageWidth - 39, sigY + 12, { align: "center" });

        doc.setDrawColor(200, 200, 200);
        doc.line(pageWidth - 64, sigY + 32, pageWidth - 14, sigY + 32);
        doc.setFontSize(7);
        doc.text("Name / Designation", pageWidth - 39, sigY + 36, { align: "center" });

        // 5. Footer
        doc.setFillColor(15, 23, 42);
        doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const footerText = `Generated by CenzPayroll • Product by Cenzios Pvt Ltd • ${periodStr}`;
        doc.text(footerText, pageWidth / 2, pageHeight - 7, { align: "center" });

        doc.save(`EPF_ETF_Report_${months[startMonth]}_${startYear}.pdf`);
    } else {
        // Excel/CSV implementation
        const wsData: any[] = [
            ["EPF / ETF Summary Report"],
            [`Company: ${companyName}`],
            [`Period: ${periodStr}`],
            [],
            ["Employee ID", "Employee Name", "EPF No", "Basic Salary", "Emp EPF (8%)", "Employer EPF (12%)", "ETF (3%)", "Total Contribution"],
            ...reportData.map(item => [
                item.employeeCode,
                item.fullName,
                item.epfNo,
                xlsNum(item.basicSalary),
                xlsNum(item.empEpf),
                xlsNum(item.employerEpf),
                xlsNum(item.etf),
                xlsNum(item.totalContribution)
            ]),
            [],
            ["Total", "", "", xlsNum(totals.basicSalary), xlsNum(totals.empEpf), xlsNum(totals.employerEpf), xlsNum(totals.etf), xlsNum(totals.totalContribution)]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "EPF ETF Report");
            XLSX.writeFile(wb, `EPF_ETF_Report_${months[startMonth]}_${startYear}.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `EPF_ETF_Report_${months[startMonth]}_${startYear}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
