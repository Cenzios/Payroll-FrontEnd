import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// --- Types ---

export interface Allowance {
    name: string;
    amount: number;
}

export interface Deduction {
    name: string;
    amount: number;
}

export interface PayslipData {
    salaryType: string;
    basicSalary: number;
    workedDays: number;
    basicPay: number;
    otAmount: number;
    otHours: number;
    allowances: Allowance[];
    isEpfEnabled: boolean;
    epf8: number;
    loanDeduction: number;
    deductions: Deduction[];
    totalDeductions: number;
    netSalary: number;
    epf12: number;
    etf3: number;
}

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
    basicPay: number;
    otAmount: number;
    otHours?: number;
    grossPay: number;
    employeeEPF: number;
    salaryAdvance: number;
    netPay: number;
    tax?: number;
    deductions?: number;
    companyEPFETF?: number;
    loanDeduction?: number;
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
    basicSalary: number;
    totalAllowances: number;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    workedDays: number;
    salaryType: string;
    otHours: number;
    otAmount: number;
    epf8: number;
    loanDeduction: number;
    salaryAdvance: number;
}

// --- Helper Functions ---

const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

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
    doc.setFillColor(15, 23, 42); // Very dark blue base (#0F172A)
    doc.rect(0, 0, pageWidth, 50, "F");

    // First Circle (Medium Blue, Center-Left)
    doc.setFillColor(28, 48, 120); // #1C3078
    doc.circle(150, 40, 40, "F");

    // Second Circle (Dark Blue, Right)
    doc.setFillColor(13, 26, 80); // #0D1A50
    doc.circle(190, 30, 40, "F");

    // Fill background color for everything below header to be super light/white
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

    // Yellow vertical line
    doc.setFillColor(255, 184, 0); // #ffb800
    doc.rect(14, 10, 1, 30, "F");

    // Left Header Texts
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CenzHRM", 19, 13);

    doc.setTextColor(255, 184, 0); // Yellow
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
        { label: "Basic Salary", value: `Rs ${basicSalary.toLocaleString(undefined, { minimumFractionDigits: 0 })}` },
        { label: "Total Allowances", value: `Rs ${totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 0 })}` },
        { label: "Gross Pay", value: `Rs ${grossPay.toLocaleString(undefined, { minimumFractionDigits: 0 })}` },
        { label: "Total Deduction", value: `Rs ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 0 })}` },
        { label: "Net Pay", value: netPay.toLocaleString(undefined, { minimumFractionDigits: 2 }) }
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
    doc.text("Rate (Rs)", 140, currentY + 6.5, { align: "center" });
    doc.text("Amount (Rs)", pageWidth - 18, currentY + 6.5, { align: "right" });

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
    const dailyRateStr = salaryType === 'MONTHLY' ? (basicSalary / (workedDays || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Draw Rows based on image design
    drawRow("Basic salary", `${workedDays} days`, dailyRateStr, basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawRow("Overtime", `${otHours} hrs`, (otAmount / (otHours || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), otAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawRow("Employee EPF deduction", "8%", "0.00", epf8.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawRow("Loan deduction", "—", "—", loanDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawRow("Advance deduction", "—", "—", salaryAdvance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), true);

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

    doc.setTextColor(255, 184, 0); // Yellow
    doc.text(`Rs. ${netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 18, currentY + 8, { align: "right" });

    // 6. FOOTER
    doc.setFillColor(15, 26, 40); // Darker Blue
    doc.rect(0, pageHeight - 16, pageWidth, 16, "F");

    doc.setTextColor(120, 130, 160); // Grayish Blue
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const footerText = `Generated by CenzHRM • Product by Cenzios Pvt Ltd • Year: ${year} • Month: ${new Date(year, month - 1).toLocaleString("default", { month: "long" })}`;
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
    } = data;

    if (format === "pdf") {
        const doc = new jsPDF();
        const periodStr = new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" });

        // 1. Header Background (Dark Rect at top)
        doc.setFillColor(45, 45, 45); // #2d2d2d
        doc.rect(0, 0, 210, 45, "F");

        // Simulated curves in header
        doc.setFillColor(60, 60, 60);
        doc.circle(210, 10, 70, "F");
        doc.setFillColor(15, 15, 15);
        doc.circle(240, 20, 65, "F");

        // Vertical accent line
        doc.setFillColor(255, 255, 255);
        doc.rect(14, 10, 1, 26, "F");

        // Clip overflow: Draw white rect over everything below the header
        doc.rect(0, 45, 210, 252, "F");

        // Header Texts - Left
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzHRM", 18, 13);

        doc.setFontSize(26);
        doc.text("Pay Slip", 18, 25);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(`Here's your Payroll History • Period: ${periodStr}`, 18, 33);

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

        // Details Grid
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text("Employee Name", 14, 70);
        doc.text("Employee No", 75, 70);
        doc.text("Designation", 125, 70);
        doc.text("Pay Period", 175, 70);

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
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("EARNINGS", 14, 92);

        let currentY = 100;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Description", 14, currentY);
        doc.text("Amount (Rs.)", 196, currentY, { align: "right" });
        currentY += 4;

        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY, 196, currentY);
        currentY += 8;

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

        addRow("Rate Type", previewPayslip.salaryType);
        addRow("Basic Rate", formatCurrency(previewPayslip.basicSalary));
        addRow("Working Days", companyWorkingDays.toString());
        addRow("Worked Days", previewPayslip.workedDays.toString());
        addRow("Calculated Basic Pay", formatCurrency(previewPayslip.basicPay));

        if (previewPayslip.otAmount > 0) {
            addRow(`OT Amount (${previewPayslip.otHours} hrs)`, formatCurrency(previewPayslip.otAmount));
        }

        (previewPayslip.allowances || []).forEach(a => {
            addRow(a.name, formatCurrency(a.amount));
        });

        // Gross Earnings End Line
        currentY += 1;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;

        let gross = previewPayslip.basicPay + previewPayslip.otAmount + (previewPayslip.allowances || []).reduce((sum, a) => sum + a.amount, 0);
        addRow("Gross Earnings", formatCurrency(gross), true);

        // 4. DEDUCTIONS SECTION
        currentY += 8;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("DEDUCTIONS", 14, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Description", 14, currentY);
        doc.text("Amount (Rs.)", 196, currentY, { align: "right" });
        currentY += 4;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 8;

        if (previewPayslip.isEpfEnabled) {
            addRow("EPF Employee (8%)", formatCurrency(previewPayslip.epf8));
        }
        if (previewPayslip.loanDeduction > 0) {
            addRow("Loan Installment", formatCurrency(previewPayslip.loanDeduction));
        }
        previewPayslip.deductions.forEach(d => {
            if (d.amount > 0) {
                addRow(d.name, formatCurrency(d.amount));
            }
        });

        currentY += 1;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;
        addRow("Total Deductions", formatCurrency(previewPayslip.totalDeductions), true);

        // 5. NET SALARY BOX
        currentY += 12;
        doc.setFillColor(85, 80, 85); // Dark banner
        doc.rect(14, currentY, 182, 14, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("NET SALARY", 20, currentY + 9);
        doc.text(`Net Salary Payable : ${formatCurrency(previewPayslip.netSalary)}`, 190, currentY + 9, { align: "right" });

        // 6. BOTTOM FOOTER
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(10, 10, 10);
        doc.rect(0, pageHeight - 15, 210, 15, "F");

        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated by CenzHRM - Product by Cenzios Pvt Ltd - Year: ${selectedYear} - Month: ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short" })}`, 105, pageHeight - 6, { align: "center" });

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
                `PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })} `,
            ],
            [],
            ["Employee Name", selectedEmployee.fullName],
            ["Employee No", selectedEmployee.employeeId],
            ["Designation", selectedEmployee.designation],
            [],
            ["EARNINGS", "Amount (Rs.)"],
            ["Rate Type", previewPayslip.salaryType],
            ["Basic Rate", previewPayslip.basicSalary],
            ["Working Days", companyWorkingDays],
            ["Worked Days", previewPayslip.workedDays],
            ["Calculated Basic Pay", previewPayslip.basicPay],
            ...(previewPayslip.otAmount > 0
                ? [
                    [
                        `OT Amount(${previewPayslip.otHours} hrs)`,
                        previewPayslip.otAmount,
                    ],
                ]
                : []),
            ...(previewPayslip.allowances || []).map((a) => [a.name, a.amount]),
            [
                "Gross Earnings",
                previewPayslip.basicPay +
                previewPayslip.otAmount +
                (previewPayslip.allowances || []).reduce(
                    (sum, a) => sum + a.amount,
                    0
                ),
            ],
            [],
            ["DEDUCTIONS", "Amount (Rs.)"],
            ...(previewPayslip.isEpfEnabled
                ? [["EPF Employee (8%)", previewPayslip.epf8]]
                : []),
            ...(previewPayslip.loanDeduction > 0
                ? [["Loan Installment", previewPayslip.loanDeduction]]
                : []),
            ...previewPayslip.deductions
                .filter((d) => d.amount > 0)
                .map((d) => [d.name, d.amount]),
            ["Total Deductions", previewPayslip.totalDeductions],
            [],
            ["NET SALARY PAYABLE", previewPayslip.netSalary],
            [],
            ...(previewPayslip.isEpfEnabled
                ? [
                    ["EMPLOYER CONTRIBUTIONS", "Amount (Rs.)"],
                    ["EPF Employer (12%)", previewPayslip.epf12],
                    ["ETF Employer (3%)", previewPayslip.etf3],
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
            totalBasicPay: number;
            totalGrossPay: number;
            totalEmployeeEPF: number;
            totalSalaryAdvance: number;
            totalNetPay: number;
        };
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
        overallTotals
    } = data;
    const dateRangeText = `${new Date(startYear, startMonth).toLocaleString("default", { month: "long", year: "numeric" })} - ${new Date(endYear, endMonth).toLocaleString("default", { month: "long", year: "numeric" })} `;

    if (format === "pdf") {
        const doc = new jsPDF();
        const startPeriodStr = new Date(startYear, startMonth).toLocaleString("default", { month: "long", year: "numeric" });
        const endPeriodStr = new Date(endYear, endMonth).toLocaleString("default", { month: "long", year: "numeric" });
        const periodStr = `${startPeriodStr} - ${endPeriodStr}`;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header Background (Base Dark Blue with 2 Circles)
        doc.setFillColor(15, 23, 42); // #0F172A
        doc.rect(0, 0, pageWidth, 50, "F");

        doc.setFillColor(28, 48, 120); // #1C3078
        doc.circle(150, 40, 40, "F");

        doc.setFillColor(13, 26, 80); // #0D1A50
        doc.circle(190, 30, 40, "F");

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 50, pageWidth, pageHeight - 50, "F");

        // Yellow vertical line
        doc.setFillColor(255, 184, 0);
        doc.rect(14, 10, 1, 30, "F");

        // Left Header Texts
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CenzHRM", 19, 13);

        doc.setTextColor(255, 184, 0);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Payroll Summary Report", 19, 26);

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

        // 2. OVERVIEW BANNER
        let currentY = 56;
        doc.setFillColor(243, 246, 253);
        doc.rect(14, currentY, pageWidth - 28, 12, "F");

        doc.setTextColor(23, 44, 108);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("MULTI-MONTH PAYROLL OVERVIEW", 20, currentY + 8);

        doc.setTextColor(100, 110, 140);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Period: ${periodStr}`, pageWidth - 20, currentY + 8, { align: "right" });

        // 3. PERIOD SUMMARY Section
        currentY += 18;
        doc.setFillColor(33, 60, 133); // Deep blue
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
            { label: "Total Basic", value: `Rs ${overallTotals.totalBasicPay.toLocaleString()}` },
            { label: "Total Gross", value: `Rs ${overallTotals.totalGrossPay.toLocaleString()}` },
            { label: "Total EPF (8%)", value: `Rs ${overallTotals.totalEmployeeEPF.toLocaleString()}` },
            { label: "Total Advance", value: `Rs ${overallTotals.totalSalaryAdvance.toLocaleString()}` },
            { label: "Total Net Pay", value: `Rs ${overallTotals.totalNetPay.toLocaleString()}`, isNet: true }
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
        monthlyData.forEach((monthData) => {
            if (monthData.employees.length === 0) return;

            // Check for new page
            if (currentY + 40 > pageHeight) {
                doc.addPage();
                currentY = 20;
            }

            // Month Heading
            doc.setFillColor(33, 60, 133);
            doc.rect(14, currentY, pageWidth - 28, 10, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${monthData.month} ${monthData.year}`, 20, currentY + 6.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`${monthData.employees.length} employees`, pageWidth - 20, currentY + 6.5, { align: "right" });
            currentY += 10;

            const tableBody = monthData.employees.map((emp) => [
                emp.employeeCode || "-",
                emp.employeeName || "-",
                emp.workingDays,
                emp.basicPay.toLocaleString(),
                (emp.otAmount || 0).toLocaleString(),
                emp.grossPay.toLocaleString(),
                emp.employeeEPF.toLocaleString(),
                (emp.salaryAdvance || 0).toLocaleString(),
                emp.netPay.toLocaleString(),
            ]);

            // Monthly Totals
            const mTotalBasic = monthData.employees.reduce((s, e) => s + e.basicPay, 0);
            const mTotalOT = monthData.employees.reduce((s, e) => s + (e.otAmount || 0), 0);
            const mTotalGross = monthData.employees.reduce((s, e) => s + e.grossPay, 0);
            const mTotalEPF = monthData.employees.reduce((s, e) => s + e.employeeEPF, 0);
            const mTotalAdvance = monthData.employees.reduce((s, e) => s + (e.salaryAdvance || 0), 0);
            const mTotalNet = monthData.employees.reduce((s, e) => s + e.netPay, 0);

            tableBody.push([
                "", "Monthly Total", "",
                mTotalBasic.toLocaleString(),
                mTotalOT.toLocaleString(),
                mTotalGross.toLocaleString(),
                mTotalEPF.toLocaleString(),
                mTotalAdvance.toLocaleString(),
                mTotalNet.toLocaleString()
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [["Emp ID", "Name", "Days", "Basic", "OT", "Gross", "EPF (8%)", "Advance", "Net Pay"]],
                body: tableBody,
                theme: "plain",
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [243, 246, 253], textColor: [23, 44, 108], fontStyle: "bold" },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 12, halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    if (data.row.index === tableBody.length - 1) {
                        data.cell.styles.fillColor = [22, 28, 45]; // Dark background for total
                        data.cell.styles.textColor = [255, 184, 0]; // Yellow text
                        data.cell.styles.fontStyle = "bold";
                        if (data.column.index === 1) {
                            data.cell.styles.halign = 'right';
                        }
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
            doc.setFillColor(15, 26, 40);
            doc.rect(0, pageHeight - 16, pageWidth, 16, "F");
            doc.setTextColor(120, 130, 160);
            doc.setFontSize(8);
            doc.text(`Generated by CenzHRM • Product by Cenzios Pvt Ltd • Year: ${new Date().getFullYear()} • Month: ${new Date().toLocaleString('default', { month: 'long' })}`, pageWidth / 2, pageHeight - 6, { align: "center" });
            doc.text(`Page ${i} / ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
        }

        doc.save(`Payroll_Summary_Report.pdf`);
    } else {
        const wsData: any[] = [["Payroll Summary Report"], [dateRangeText], []];

        monthlyData.forEach((monthData) => {
            if (monthData.employees.length === 0) return;

            wsData.push([`${monthData.month} ${monthData.year} `]);
            wsData.push([
                "Emp ID",
                "Name",
                "Days",
                "Basic Salary",
                "OT Amount",
                "Gross Pay",
                "EPF (8%)",
                "Salary Advance",
                "Net Pay",
            ]);

            monthData.employees.forEach((emp) => {
                wsData.push([
                    emp.employeeCode || "-",
                    emp.employeeName || "-",
                    emp.workingDays,
                    emp.basicPay,
                    emp.otAmount,
                    emp.grossPay,
                    emp.employeeEPF,
                    emp.salaryAdvance,
                    emp.netPay,
                ]);
            });
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        if (format === "excel") {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, "Payroll_Summary_Report.xlsx");
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "Payroll_Summary_Report.csv");
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
        basicSalary: number;
        joinedDate: string;
        monthlyBreakdown: any[];
        annualTotals: any;
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
        doc.text(`Basic Salary: RS ${basicSalary.toLocaleString()} `, 120, yPos);
        yPos += 7;

        doc.text(`Joined Date: ${joinedDate} `, 14, yPos);
        yPos += 10;

        const tableData = monthlyBreakdown.map((row) => [
            row.month,
            row.workedDays.toString(),
            `RS ${row.basicPay.toLocaleString()} `,
            `RS ${row.otAmount.toLocaleString()} (${row.otHours}h)`,
            `RS ${row.grossPay.toLocaleString()} `,
            `RS ${row.netPay.toLocaleString()} `,
            `RS ${row.salaryAdvance.toLocaleString()} `,
            `RS ${row.deductions.toLocaleString()} `,
            `RS ${row.employeeEPF.toLocaleString()} `,
            `RS ${row.companyEPFETF.toLocaleString()} `,
        ]);

        tableData.push([
            "SELECTED MONTH TOTALS",
            annualTotals.workedDays.toString(),
            `RS ${annualTotals.basicPay.toLocaleString()} `,
            `RS ${annualTotals.otAmount.toLocaleString()} `,
            `RS ${annualTotals.grossPay.toLocaleString()} `,
            `RS ${annualTotals.netPay.toLocaleString()} `,
            `RS ${annualTotals.salaryAdvance.toLocaleString()} `,
            `RS ${annualTotals.deductions.toLocaleString()} `,
            `RS ${annualTotals.employeeEPF.toLocaleString()} `,
            `RS ${annualTotals.companyEPFETF.toLocaleString()} `,
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
                `RS ${basicSalary.toLocaleString()} `,
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
                row.basicPay,
                row.otAmount,
                row.grossPay,
                row.netPay,
                row.salaryAdvance,
                row.deductions,
                row.employeeEPF,
                row.companyEPFETF,
            ]),
            [
                "TOTALS",
                annualTotals.workedDays,
                annualTotals.basicPay,
                annualTotals.otAmount,
                annualTotals.grossPay,
                annualTotals.netPay,
                "",
                annualTotals.deductions,
                annualTotals.employeeEPF,
                annualTotals.companyEPFETF,
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
            totalGrossPay: number;
        };
        employees: ReportEmployee[];
        totals: any;
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
            `Total Gross Pay: RS ${metadata.totalGrossPay.toLocaleString()} `,
            14,
            yPos
        );
        yPos += 15;

        const tableData = employees.map((emp) => [
            emp.employeeCode,
            emp.employeeName,
            emp.workingDays.toString(),
            `RS ${(emp.basicPay || 0).toLocaleString()} `,
            `RS ${(emp.otAmount || 0).toLocaleString()} (${emp.otHours || 0}h)`,
            `RS ${(emp.grossPay || 0).toLocaleString()} `,
            `RS ${(emp.salaryAdvance || 0).toLocaleString()} `,
            `RS ${(emp.deductions || 0).toLocaleString()} `,
            `RS ${(emp.netPay || 0).toLocaleString()} `,
        ]);

        tableData.push([
            "TOTAL AMOUNTS",
            "",
            "",
            `RS ${totals.basicPay.toLocaleString()} `,
            `RS ${totals.otAmount.toLocaleString()} `,
            `RS ${totals.grossPay.toLocaleString()} `,
            `RS ${totals.salaryAdvance.toLocaleString()} `,
            `RS ${totals.deductions.toLocaleString()} `,
            `RS ${totals.netPay.toLocaleString()} `,
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [
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
            ["Total Gross Pay:", `RS ${metadata.totalGrossPay.toLocaleString()} `],
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
                emp.workingDays,
                emp.basicPay || 0,
                emp.otAmount || 0,
                emp.grossPay || 0,
                emp.salaryAdvance || 0,
                emp.deductions || 0,
                emp.netPay || 0,
            ]),
            [
                "TOTAL AMOUNTS",
                "",
                "",
                totals.basicPay,
                totals.otAmount,
                totals.grossPay,
                totals.salaryAdvance,
                totals.deductions,
                totals.netPay,
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
        amount: number;
    }[];
    month: number;
    year: number;
    totalAmount: number;
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
        doc.text("CenzHRM", 19, 13);

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
            `Rs ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
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
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY;

        // Total Row
        doc.setFillColor(15, 23, 42);
        doc.rect(14, currentY, pageWidth - 28, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Net Pay", 20, currentY + 6.5);
        doc.setTextColor(255, 184, 0);
        doc.text(`Rs. ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, currentY + 6.5, { align: "right" });

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
            doc.text(`Generated by CenzHRM • Product by Cenzios Pvt Ltd • Year: ${year} • Month: ${monthName}`, pageWidth / 2, pageHeight - 6, { align: "center" });
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
                item.amount.toString()
            ]);
        });

        wsData.push([]);
        wsData.push(["", "", "", "", "Net Pay", totalAmount.toString()]);

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
        basicSalary: number;
        empEpf: number;
        employerEpf: number;
        etf: number;
        totalContribution: number;
    }[];
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    totals: {
        count: number;
        basicSalary: number;
        empEpf: number;
        employerEpf: number;
        etf: number;
        totalContribution: number;
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
        doc.text("CenzHRM", 19, 13);

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
            item.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            item.empEpf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            item.employerEpf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            item.etf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            item.totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]);

        // Add Total row to table body
        tableBody.push([
            "", "", "Total",
            totals.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            totals.empEpf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            totals.employerEpf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            totals.etf.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            totals.totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2 })
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
        doc.text(`Rs ${totals.empEpf.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14 + boxWidth / 2, finalY + 14, { align: "center" });

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
        doc.text(`Rs ${totals.employerEpf.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14 + boxWidth + 5 + boxWidth / 2, finalY + 14, { align: "center" });

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
        doc.text(`Rs ${totals.etf.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14 + (boxWidth + 5) * 2 + boxWidth / 2, finalY + 14, { align: "center" });

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
        doc.text(`Rs ${totals.totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14 + (boxWidth + 5) * 3 + boxWidth / 2, finalY + 14, { align: "center" });

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
        const footerText = `Generated by CenzHRM • Product by Cenzios Pvt Ltd • ${periodStr}`;
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
                item.basicSalary,
                item.empEpf,
                item.employerEpf,
                item.etf,
                item.totalContribution
            ]),
            [],
            ["Total", "", "", totals.basicSalary, totals.empEpf, totals.employerEpf, totals.etf, totals.totalContribution]
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
