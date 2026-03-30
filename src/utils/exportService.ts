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

// --- Helper Functions ---

const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

// --- Export Functions ---

export const exportPayslip = (
    format: "pdf" | "excel" | "csv",
    data: {
        previewPayslip: PayslipData;
        selectedEmployee: Employee;
        companyName: string;
        selectedMonth: number;
        selectedYear: number;
        companyWorkingDays: number;
    }
) => {
    const {
        previewPayslip,
        selectedEmployee,
        companyName,
        selectedMonth,
        selectedYear,
        companyWorkingDays,
    } = data;

    if (format === "pdf") {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(companyName.toUpperCase(), 105, 20, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(
            `PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })}`,
            105,
            30,
            { align: "center" }
        );

        doc.line(14, 35, 196, 35);

        // Employee Details
        doc.setFontSize(10);
        doc.text(`Employee Name : ${selectedEmployee.fullName}`, 14, 45);
        doc.text(`Employee No   : ${selectedEmployee.employeeId}`, 14, 52);
        doc.text(`Designation   : ${selectedEmployee.designation}`, 14, 59);

        // Earnings
        doc.setFontSize(11);
        doc.text("EARNINGS", 14, 70);

        autoTable(doc, {
            startY: 75,
            head: [["Description", "Amount (Rs.)"]],
            body: [
                ["Rate Type", previewPayslip.salaryType],
                ["Basic Rate", `Rs. ${previewPayslip.basicSalary.toLocaleString()}`],
                ["Working Days", companyWorkingDays.toString()],
                ["Worked Days", previewPayslip.workedDays.toString()],
                ["Calculated Basic Pay", `Rs. ${previewPayslip.basicPay.toLocaleString()}`],
                ...(previewPayslip.otAmount > 0
                    ? [
                        [
                            `OT Amount (${previewPayslip.otHours} hrs)`,
                            `Rs. ${previewPayslip.otAmount.toLocaleString()}`,
                        ],
                    ]
                    : []),
                ...(previewPayslip.allowances || []).map((a) => [
                    a.name,
                    `Rs. ${a.amount.toLocaleString()}`,
                ]),
                [
                    "Gross Earnings",
                    `Rs. ${(
                        previewPayslip.basicPay +
                        previewPayslip.otAmount +
                        (previewPayslip.allowances || []).reduce(
                            (sum, a) => sum + a.amount,
                            0
                        )
                    ).toLocaleString()}`,
                ],
            ],
            theme: "plain",
            styles: { fontSize: 10, cellPadding: 2 },
            headStyles: { halign: "left" },
            columnStyles: {
                1: { halign: "right" },
            },
            didParseCell: (data) => {
                if (data.section === "head" && data.column.index === 1) {
                    data.cell.styles.halign = "right";
                }
            },
        });

        let currentY = (doc as any).lastAutoTable.finalY + 10;

        // Deductions
        doc.text("DEDUCTIONS", 14, currentY);
        currentY += 5;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        if (previewPayslip.isEpfEnabled) {
            doc.text("EPF Employee (8%)", 14, currentY);
            doc.text(formatCurrency(previewPayslip.epf8), 196, currentY, {
                align: "right",
            });
            currentY += 7;
        }

        previewPayslip.deductions.forEach((d) => {
            if (d.amount > 0) {
                doc.text(d.name, 14, currentY);
                doc.text(formatCurrency(d.amount), 196, currentY, { align: "right" });
                currentY += 7;
            }
        });

        // Total Deductions
        doc.setLineWidth(0.2);
        doc.line(14, currentY, 196, currentY);
        currentY += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Total Deductions", 14, currentY);
        doc.text(formatCurrency(previewPayslip.totalDeductions), 196, currentY, {
            align: "right",
        });
        currentY += 10;

        // Net Salary
        doc.setLineWidth(0.5);
        doc.line(14, currentY, 196, currentY);
        doc.setFontSize(12);
        doc.text("NET SALARY", 14, currentY + 8);
        doc.text(
            `Net Salary Payable : ${formatCurrency(previewPayslip.netSalary)}`,
            196,
            currentY + 8,
            { align: "right" }
        );
        doc.line(14, currentY + 12, 196, currentY + 12);
        doc.line(14, currentY + 14, 196, currentY + 14);

        currentY += 25;

        // Employer Contributions
        if (previewPayslip.isEpfEnabled) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("EMPLOYER CONTRIBUTIONS (Informational)", 14, currentY);
            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.text("EPF Employer (12%)", 14, currentY);
            doc.text(formatCurrency(previewPayslip.epf12), 196, currentY, {
                align: "right",
            });
            currentY += 7;
            doc.text("ETF Employer (3%)", 14, currentY);
            doc.text(formatCurrency(previewPayslip.etf3), 196, currentY, {
                align: "right",
            });
        }

        // Signature Area
        currentY += 30;
        doc.line(14, currentY, 70, currentY);
        doc.line(140, currentY, 196, currentY);
        doc.setFontSize(9);
        doc.text("Prepared By", 42, currentY + 5, { align: "center" });
        doc.text("Employee Signature", 168, currentY + 5, { align: "center" });

        doc.save(`Payslip_${selectedEmployee.employeeId}.pdf`);
    } else if (format === "excel" || format === "csv") {
        const wsData = [
            [companyName.toUpperCase()],
            [
                `PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long", year: "numeric" })}`,
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
                        `OT Amount (${previewPayslip.otHours} hrs)`,
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
        monthlyData: MonthData[];
        startMonth: number;
        startYear: number;
        endMonth: number;
        endYear: number;
    }
) => {
    const { monthlyData, startMonth, startYear, endMonth, endYear } = data;
    const dateRangeText = `${new Date(startYear, startMonth).toLocaleString("default", { month: "long", year: "numeric" })} - ${new Date(endYear, endMonth).toLocaleString("default", { month: "long", year: "numeric" })}`;

    if (format === "pdf") {
        const doc = new jsPDF();
        doc.text(`Payroll Summary Report`, 14, 15);
        doc.setFontSize(10);
        doc.text(dateRangeText, 14, 22);

        let startY = 30;
        monthlyData.forEach((monthData) => {
            if (monthData.employees.length === 0) return;

            doc.setFontSize(12);
            doc.text(`${monthData.month} ${monthData.year}`, 14, startY);
            startY += 5;

            const tableBody = monthData.employees.map((emp) => [
                emp.employeeCode || "-",
                emp.employeeName || "-",
                emp.workingDays,
                emp.basicPay.toLocaleString(),
                emp.otAmount.toLocaleString(),
                emp.grossPay.toLocaleString(),
                emp.employeeEPF.toLocaleString(),
                emp.salaryAdvance.toLocaleString(),
                emp.netPay.toLocaleString(),
            ]);

            autoTable(doc, {
                startY,
                head: [
                    [
                        "Emp ID",
                        "Name",
                        "Days",
                        "Basic",
                        "OT",
                        "Gross",
                        "EPF (8%)",
                        "Advance",
                        "Net Pay",
                    ],
                ],
                body: tableBody,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 133, 244] },
            });

            startY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save("Payroll_Summary_Report.pdf");
    } else {
        const wsData: any[] = [["Payroll Summary Report"], [dateRangeText], []];

        monthlyData.forEach((monthData) => {
            if (monthData.employees.length === 0) return;

            wsData.push([`${monthData.month} ${monthData.year}`]);
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

        doc.text(`Employee Name: ${employeeName}`, 14, yPos);
        doc.text(`Employee ID: ${employeeCode}`, 120, yPos);
        yPos += 7;

        doc.text(`Position: ${designation}`, 14, yPos);
        doc.text(`Basic Salary: RS ${basicSalary.toLocaleString()}`, 120, yPos);
        yPos += 7;

        doc.text(`Joined Date: ${joinedDate}`, 14, yPos);
        yPos += 10;

        const tableData = monthlyBreakdown.map((row) => [
            row.month,
            row.workedDays.toString(),
            `RS ${row.basicPay.toLocaleString()}`,
            `RS ${row.otAmount.toLocaleString()} (${row.otHours}h)`,
            `RS ${row.grossPay.toLocaleString()}`,
            `RS ${row.netPay.toLocaleString()}`,
            `RS ${row.salaryAdvance.toLocaleString()}`,
            `RS ${row.deductions.toLocaleString()}`,
            `RS ${row.employeeEPF.toLocaleString()}`,
            `RS ${row.companyEPFETF.toLocaleString()}`,
        ]);

        tableData.push([
            "SELECTED MONTH TOTALS",
            annualTotals.workedDays.toString(),
            `RS ${annualTotals.basicPay.toLocaleString()}`,
            `RS ${annualTotals.otAmount.toLocaleString()}`,
            `RS ${annualTotals.grossPay.toLocaleString()}`,
            `RS ${annualTotals.netPay.toLocaleString()}`,
            `RS ${annualTotals.salaryAdvance.toLocaleString()}`,
            `RS ${annualTotals.deductions.toLocaleString()}`,
            `RS ${annualTotals.employeeEPF.toLocaleString()}`,
            `RS ${annualTotals.companyEPFETF.toLocaleString()}`,
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

        doc.save(`${employeeCode}_Payroll_Summary.pdf`);
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
                `RS ${basicSalary.toLocaleString()}`,
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
            XLSX.writeFile(wb, `${employeeCode}_Payroll_Summary.xlsx`);
        } else {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${employeeCode}_Payroll_Summary.csv`);
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

        doc.text(`Employee Count: ${metadata.employeeCount}`, 14, yPos);
        doc.text(`Date Period: ${metadata.datePeriod}`, 100, yPos);
        yPos += 7;
        doc.text(`Department: ${metadata.department}`, 14, yPos);
        doc.text(`Report Type: ${metadata.reportType}`, 100, yPos);
        yPos += 7;
        doc.text(
            `Total Gross Pay: RS ${metadata.totalGrossPay.toLocaleString()}`,
            14,
            yPos
        );
        yPos += 15;

        const tableData = employees.map((emp) => [
            emp.employeeCode,
            emp.employeeName,
            emp.workingDays.toString(),
            `RS ${(emp.basicPay || 0).toLocaleString()}`,
            `RS ${(emp.otAmount || 0).toLocaleString()} (${emp.otHours || 0}h)`,
            `RS ${(emp.grossPay || 0).toLocaleString()}`,
            `RS ${(emp.salaryAdvance || 0).toLocaleString()}`,
            `RS ${(emp.deductions || 0).toLocaleString()}`,
            `RS ${(emp.netPay || 0).toLocaleString()}`,
        ]);

        tableData.push([
            "TOTAL AMOUNTS",
            "",
            "",
            `RS ${totals.basicPay.toLocaleString()}`,
            `RS ${totals.otAmount.toLocaleString()}`,
            `RS ${totals.grossPay.toLocaleString()}`,
            `RS ${totals.salaryAdvance.toLocaleString()}`,
            `RS ${totals.deductions.toLocaleString()}`,
            `RS ${totals.netPay.toLocaleString()}`,
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
            ["Total Gross Pay:", `RS ${metadata.totalGrossPay.toLocaleString()}`],
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
