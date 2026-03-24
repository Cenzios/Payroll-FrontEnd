import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Calculator,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  useGetEmployeesQuery,
  useGetCompaniesQuery,
  useGetAllPendingLoanInstallmentsQuery,
} from "../store/apiSlice";
import { salaryApi } from "../api/salaryApi";
import { Employee } from "../types/employee.types";
import Toast from "../components/Toast";
import SalaryListSkeleton from "../components/skeletons/SalaryListSkeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import PageHeader from "../components/PageHeader";
import {
  setCompanyWorkingDays,
  setEmployeeWorkedDays,
  setEmployeeOtHours,
  setEmployeeSalaryAdvance,
  toggleEpfEtf,
  toggleLoanEnabled,
  setPreviewPayslip,
  setMonth,
  setYear,
} from "../store/slices/salarySlice";
import EmployeeSalaryCard from "../components/EmployeeSalaryCard";
import PayslipPreview from "../components/PayslipPreview";
import ManageSalaryModal from "../components/ManageSalaryModal";

const Salary = () => {
  const dispatch = useAppDispatch();
  const { selectedCompanyId } = useAppSelector((state) => state.auth);
  const {
    companyWorkingDays,
    employeeWorkedDays,
    employeeOtHours,
    employeeSalaryAdvance,
    employeeEpfEtf,
    employeeLoanEnabled,
    previewPayslip,
    selectedMonth,
    selectedYear,
  } = useAppSelector((state) => state.salary);

  const [search, setSearch] = useState("");

  // Selection State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Pending Loans Query (for all employees)
  const { data: allPendingLoans } = useGetAllPendingLoanInstallmentsQuery(
    {
      companyId: selectedCompanyId || "",
      month: selectedMonth + 1,
      year: selectedYear,
    },
    {
      skip: !selectedCompanyId,
    },
  );

  // Create a map of employeeId -> loan installment total
  const employeeLoanMap = (allPendingLoans || []).reduce(
    (map: Record<string, number>, inst: any) => {
      const empId = inst.loan?.employeeId;
      if (empId) {
        map[empId] = (map[empId] || 0) + (inst.amount - (inst.paidAmount || 0));
      }
      return map;
    },
    {},
  );

  // Allowance / Deduction local state per employee
  const [allowanceToggles, setAllowanceToggles] = useState<
    Record<string, boolean>
  >({});
  const [deductionToggles, setDeductionToggles] = useState<
    Record<string, boolean>
  >({});
  const [salaryAllowances, setSalaryAllowances] = useState<
    Record<string, { type: string; amount: number }[]>
  >({});
  const [salaryDeductions, setSalaryDeductions] = useState<
    Record<string, { type: string; amount: number }[]>
  >({});

  // Manage modal state
  const [manageModal, setManageModal] = useState<{
    type: "allowance" | "deduction";
    empId: string;
  } | null>(null);
  const [modalEntries, setModalEntries] = useState<
    { type: string; amount: number }[]
  >([]);

  const openManageModal = (type: "allowance" | "deduction", emp: Employee) => {
    const empId = emp.id;
    let existing =
      type === "allowance"
        ? salaryAllowances[empId] || []
        : salaryDeductions[empId] || [];

    // Populate from DB if not edited locally yet
    if (existing.length === 0) {
      if (
        type === "allowance" &&
        emp.recurringAllowances &&
        emp.recurringAllowances.length > 0
      ) {
        existing = emp.recurringAllowances.map((a) => ({
          type: a.type,
          amount: a.amount,
        }));
        setSalaryAllowances((prev) => ({ ...prev, [empId]: existing }));
      } else if (
        type === "deduction" &&
        emp.recurringDeductions &&
        emp.recurringDeductions.length > 0
      ) {
        existing = emp.recurringDeductions.map((d) => ({
          type: d.type,
          amount: d.amount,
        }));
        setSalaryDeductions((prev) => ({ ...prev, [empId]: existing }));
      }
    }

    setModalEntries([...existing, { type: "", amount: 0 }]);
    setManageModal({ type, empId });
  };

  const handleModalSave = () => {
    if (!manageModal) return;
    const validEntries = modalEntries.filter(
      (e) => e.type.trim() && e.amount > 0,
    );
    if (manageModal.type === "allowance") {
      setSalaryAllowances((prev) => ({
        ...prev,
        [manageModal.empId]: validEntries,
      }));
    } else {
      setSalaryDeductions((prev) => ({
        ...prev,
        [manageModal.empId]: validEntries,
      }));
    }
    setManageModal(null);
    setModalEntries([]);
  };

  const handleModalCancel = () => {
    setManageModal(null);
    setModalEntries([]);
  };

  // Touch tracking for validation
  const [touchedFields, setTouchedFields] = useState<{
    month: boolean;
    companyDays: boolean;
    employeeDays: Record<string, boolean>;
  }>({
    month: false,
    companyDays: false,
    employeeDays: {},
  });

  // RTK Query for Employees
  const { data, isLoading } = useGetEmployeesQuery(
    {
      companyId: selectedCompanyId || "",
      page: 1,
      limit: 100,
      search,
      status: "ACTIVE", // Fetch ACTIVE only
    },
    {
      skip: !selectedCompanyId,
    },
  );

  const employees = data?.employees || [];

  // Fetch Companies to get the name
  const { data: companies } = useGetCompaniesQuery();
  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId);
  const companyName = selectedCompany?.name || "Company Name";

  // Helper functions for Redux State
  const getEmployeeValues = (empId: string) => {
    const workedDays = employeeWorkedDays[empId] ?? companyWorkingDays;
    const isEpfEnabled = employeeEpfEtf[empId] ?? true;
    const isLoanEnabled = employeeLoanEnabled[empId] ?? true;
    const otHours = employeeOtHours[empId] ?? 0;
    const salaryAdvance = employeeSalaryAdvance[empId] ?? 0;
    const loanDeduction = isLoanEnabled ? employeeLoanMap[empId] || 0 : 0;
    return {
      workedDays,
      isEpfEnabled,
      isLoanEnabled,
      otHours,
      salaryAdvance,
      loanDeduction,
    };
  };

  // Helper for ordinal suffixes (1st, 2nd, etc.)
  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // --- Validation Logic ---
  const getMaxAllowedDays = (year: number, month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // If future month entirely
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return 0; // Invalid
    }

    // If current month, return days elapsed so far
    if (year === currentYear && month === currentMonth) {
      return now.getDate();
    }

    // If past month, return total days in that month
    return new Date(year, month + 1, 0).getDate();
  };

  const maxAllowedCompanyDays = getMaxAllowedDays(selectedYear, selectedMonth);
  const isFutureMonth =
    new Date(selectedYear, selectedMonth) >
    new Date(new Date().getFullYear(), new Date().getMonth());

  // Derived Errors (only shown if touched)
  const monthError =
    touchedFields.month && isFutureMonth
      ? "Cannot generate for future months"
      : null;

  const companyDaysError =
    touchedFields.companyDays &&
      (companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays)
      ? `Must be between 1 and ${maxAllowedCompanyDays} days`
      : null;

  const getEmployeeError = (empId: string, workedDays: number) => {
    if (!touchedFields.employeeDays[empId]) return null;
    if (workedDays < 0) return "Cannot be negative";
    if (workedDays > companyWorkingDays)
      return `Cannot exceed company days (${companyWorkingDays})`;
    return null;
  };

  const isBeforeJoinedDate = (emp: Employee, year: number, month: number) => {
    const joinedDate = new Date(emp.joinedDate);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth();

    if (year < joinedYear) return true;
    if (year === joinedYear && month < joinedMonth) return true;
    return false;
  };

  // Check if ANY validation error exists (for button disable)
  const hasAnyError = (emp: Employee) => {
    if (isFutureMonth) return true;
    if (isBeforeJoinedDate(emp, selectedYear, selectedMonth)) return true;
    if (companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays)
      return true;
    const { workedDays } = getEmployeeValues(emp.id);
    if (workedDays < 0 || workedDays > companyWorkingDays) return true;
    return false;
  };

  const handleCompanyWorkingDaysChange = (val: number) => {
    setTouchedFields((prev) => ({ ...prev, companyDays: true }));
    dispatch(setCompanyWorkingDays(val));
  };

  const handleEmployeeWorkedDaysChange = (empId: string, val: number) => {
    setTouchedFields((prev) => ({
      ...prev,
      employeeDays: { ...prev.employeeDays, [empId]: true },
    }));
    dispatch(setEmployeeWorkedDays({ id: empId, days: val }));
  };

  const handleMonthChange = (month: number) => {
    setTouchedFields((prev) => ({ ...prev, month: true }));
    dispatch(setMonth(month));
  };

  const handleYearChange = (year: number) => {
    setTouchedFields((prev) => ({ ...prev, month: true }));
    dispatch(setYear(year));
  };

  const handleToggleEpfEtf = (empId: string) => {
    const currentVal = employeeEpfEtf[empId] ?? true;
    dispatch(toggleEpfEtf({ id: empId, value: !currentVal }));
  };

  const handleToggleLoan = (empId: string) => {
    const currentVal = employeeLoanEnabled[empId] ?? true;
    dispatch(toggleLoanEnabled({ id: empId, value: !currentVal }));
  };

  const handleEmployeeOtHoursChange = (empId: string, val: number) => {
    dispatch(setEmployeeOtHours({ id: empId, hours: val }));
  };

  const handleEmployeeSalaryAdvanceChange = (empId: string, val: number) => {
    dispatch(setEmployeeSalaryAdvance({ id: empId, advance: val }));
  };

  // Handle Generate Pay Slip
  const handleGeneratePayslip = async (emp: Employee) => {
    setSelectedEmployee(emp);

    const {
      workedDays,
      isEpfEnabled,
      isLoanEnabled,
      otHours,
      salaryAdvance,
      loanDeduction,
    } = getEmployeeValues(emp.id);
    const otAmount = otHours * (emp.otRate || 0);

    // FINAL VALIDATION BLOCK - Mark all as touched and check
    setTouchedFields({
      month: true,
      companyDays: true,
      employeeDays: { ...touchedFields.employeeDays, [emp.id]: true },
    });

    if (
      isFutureMonth ||
      isBeforeJoinedDate(emp, selectedYear, selectedMonth) ||
      companyWorkingDays < 1 ||
      companyWorkingDays > maxAllowedCompanyDays ||
      workedDays < 0 ||
      workedDays > companyWorkingDays
    ) {
      setToast({
        message: "Please fix validation errors before generating",
        type: "error",
      });
      return;
    }

    let basicSalaryForCalc = emp.basicSalary || 0;
    let basicPay = 0;

    if (emp.salaryType === "MONTHLY") {
      basicPay = (basicSalaryForCalc / companyWorkingDays) * workedDays;
    } else {
      basicPay = basicSalaryForCalc * workedDays;
    }

    const allowanceAmount = (salaryAllowances[emp.id] || []).reduce(
      (sum, a) => sum + (a.amount || 0),
      0,
    );
    const deductionAmount = (salaryDeductions[emp.id] || []).reduce(
      (sum, d) => sum + (d.amount || 0),
      0,
    );

    // Calculations
    let epfEmployee = 0;
    let epfEmployer = basicPay * 0.12;
    let etfEmployer = basicPay * 0.03;

    if (isEpfEnabled) {
      epfEmployee = basicPay * 0.08;
    } else {
      epfEmployer = 0;
      etfEmployer = 0;
    }

    const tax = 0; // Tax will be calculated by backend
    const totalDeductions =
      epfEmployee + tax + salaryAdvance + deductionAmount + loanDeduction;
    const netSalary = basicPay + otAmount + allowanceAmount - totalDeductions;

    const details = {
      basicSalary: emp.basicSalary || 0,
      salaryType: emp.salaryType || "DAILY",
      basicPay,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      tax,
      totalDeductions,
      netSalary,
      workedDays,
      isEpfEnabled,
      otHours,
      otAmount,
      salaryAdvance,
      loanDeduction,
      epf8: epfEmployee, // For display purposes
      epf12: epfEmployer, // For display purposes
      etf3: etfEmployer, // For display purposes
      deductions: [
        { name: "Tax (PAYE)", amount: tax },
        { name: "Salary Advance", amount: salaryAdvance },
        ...(salaryDeductions[emp.id] || []).map((d) => ({
          name: d.type,
          amount: d.amount,
        })),
        ...(isLoanEnabled
          ? (allPendingLoans || []).filter(
            (inst: any) => inst.loan?.employeeId === emp.id,
          )
          : []
        ).map((inst: any) => ({
          name: `Loan Installment: ${inst.loan?.loanTitle} (${getOrdinalSuffix(inst.installmentNumber)} installment)`,
          amount: inst.amount - (inst.paidAmount || 0),
        })),
      ],
      allowances: (salaryAllowances[emp.id] || []).map((a) => ({
        name: a.type,
        amount: a.amount,
      })),
    };

    dispatch(setPreviewPayslip(details));

    // Save to DB
    if (!selectedCompanyId) return;
    setIsSaving(true);
    try {
      await salaryApi.saveSalary({
        companyId: selectedCompanyId,
        employeeId: emp.id,
        month: selectedMonth + 1,
        year: selectedYear,
        workingDays: workedDays,
        basicPay: basicPay,
        otHours: otHours,
        otAmount: otAmount,
        salaryAdvance: salaryAdvance,
        employeeEPF: epfEmployee,
        employerEPF: epfEmployer,
        etfAmount: etfEmployer,
        netSalary: netSalary,
        loanDeduction: loanDeduction,
        isLoanEnabled,
        isEpfEnabled: emp.epfEnabled,
        companyWorkingDays: companyWorkingDays,
        allowances: salaryAllowances[emp.id] || [],
        deductions: salaryDeductions[emp.id] || [],
      });
      setToast({ message: "Salary saved successfully!", type: "success" });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to save salary",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    if (selectedEmployee?.id === emp.id) {
      setSelectedEmployee(null);
    } else {
      setSelectedEmployee(emp);
    }
  };

  // Export Functions
  const exportPDF = () => {
    if (!previewPayslip || !selectedEmployee) return;

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
      { align: "center" },
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
        ...(previewPayslip.allowances || []).map((a: any) => [
          a.name,
          `Rs. ${a.amount.toLocaleString()}`,
        ]),
        [
          "Gross Earnings",
          `Rs. ${(
            previewPayslip.basicPay +
            previewPayslip.otAmount +
            (previewPayslip.allowances || []).reduce(
              (sum: number, a: any) => sum + a.amount,
              0,
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

    // Add Employee EPF only if enabled
    if (previewPayslip.isEpfEnabled) {
      doc.text("EPF Employee (8%)", 14, currentY);
      doc.text(
        `Rs. ${previewPayslip.epf8.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        196,
        currentY,
        { align: "right" },
      );
      currentY += 7;
    }

    // Add other deductions (e.g., Tax, Salary Advance, Custom Deductions)

    // Add other deductions (e.g., Tax, Salary Advance, Custom Deductions)
    previewPayslip.deductions.forEach((d: any) => {
      if (d.amount > 0) {
        doc.text(d.name, 14, currentY);
        doc.text(
          `Rs. ${d.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          196,
          currentY,
          { align: "right" },
        );
        currentY += 7;
      }
    });

    // Total Deductions
    doc.setLineWidth(0.2);
    doc.line(14, currentY, 196, currentY);
    currentY += 6; // Add space after the line
    doc.setFont("helvetica", "bold");
    doc.text("Total Deductions", 14, currentY);
    doc.text(
      `Rs. ${previewPayslip.totalDeductions.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      196,
      currentY,
      { align: "right" },
    );
    currentY += 10;

    // Net Salary
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 196, currentY);
    doc.setFontSize(12);
    doc.text("NET SALARY", 14, currentY + 8);
    doc.text(
      `Net Salary Payable : Rs. ${previewPayslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      196,
      currentY + 8,
      { align: "right" },
    );
    doc.line(14, currentY + 12, 196, currentY + 12);
    doc.line(14, currentY + 14, 196, currentY + 14);

    currentY += 25;

    // Employer Contributions
    if (previewPayslip.isEpfEnabled) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        "EMPLOYER CONTRIBUTIONS (Not included in Net Salary)",
        14,
        currentY,
      );
      autoTable(doc, {
        startY: currentY + 5,
        body: [
          [
            "EPF Employer (12%)",
            `Rs. ${previewPayslip.epf12.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          ],
          [
            "ETF Employer (3%)",
            `Rs. ${previewPayslip.etf3.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          ],
        ],
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: { 1: { halign: "right" } },
      });
      currentY = (doc as any).lastAutoTable.finalY + 30;
    } else {
      currentY += 10; // Adjust spacing if no employer contributions
    }

    // Signatures
    doc.text("Prepared By : ___________________", 14, currentY);
    doc.text("Checked By  : ___________________", 120, currentY);

    doc.text("Employee Sign : ___________________", 14, currentY + 15);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 120, currentY + 15);

    doc.save(
      `Payslip_${selectedEmployee.employeeId}_${selectedMonth + 1}_${selectedYear}.pdf`,
    );
  };

  const exportExcel = () => {
    if (!previewPayslip || !selectedEmployee) return;

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
      ...(previewPayslip.allowances || []).map((a: any) => [a.name, a.amount]),
      [
        "Gross Earnings",
        previewPayslip.basicPay +
        previewPayslip.otAmount +
        (previewPayslip.allowances || []).reduce(
          (sum: number, a: any) => sum + a.amount,
          0,
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
        .filter((d: any) => d.amount > 0)
        .map((d: any) => [d.name, d.amount]),
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
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payslip");
    XLSX.writeFile(wb, `Payslip_${selectedEmployee.employeeId}.xlsx`);
  };

  const exportCSV = () => {
    if (!previewPayslip || !selectedEmployee) return;

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
      ...(previewPayslip.allowances || []).map((a: any) => [a.name, a.amount]),
      [
        "Gross Earnings",
        previewPayslip.basicPay +
        previewPayslip.otAmount +
        (previewPayslip.allowances || []).reduce(
          (sum: number, a: any) => sum + a.amount,
          0,
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
        .filter((d: any) => d.amount > 0)
        .map((d: any) => [d.name, d.amount]),
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
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
        {/* Header + Filters - Sticky */}
        <div className="shrink-0">
          <PageHeader
            title="Salary"
            subtitle="View and calculate employee salaries"
          />

          {/* Filters/Search Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
            <div className="w-full max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Employee..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            {/* Month & Year Pickers */}
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {/* Working Days Editable Input within same style container */}
              <div className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium flex items-center gap-2">
                <span>Working Days:</span>
                <input
                  type="number"
                  value={companyWorkingDays}
                  onChange={(e) =>
                    handleCompanyWorkingDaysChange(parseInt(e.target.value) || 0)
                  }
                  onBlur={() =>
                    setTouchedFields((prev) => ({ ...prev, companyDays: true }))
                  }
                  className="w-12 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center font-bold text-gray-800"
                  min="0"
                  max="31"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 flex-1 overflow-y-auto">
          {/* LEFT SIDE: Employee Salary Cards */}
          <div className="w-8/12 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading ? (
              <SalaryListSkeleton />
            ) : employees.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                No employees found.
              </div>
            ) : (
              employees.map((emp) => {
                const {
                  workedDays,
                  isEpfEnabled,
                  isLoanEnabled,
                  otHours,
                  salaryAdvance,
                  loanDeduction,
                } = getEmployeeValues(emp.id);
                return (
                  <EmployeeSalaryCard
                    key={emp.id}
                    emp={emp}
                    selectedEmployee={selectedEmployee}
                    handleSelectEmployee={handleSelectEmployee}
                    workedDays={workedDays}
                    isEpfEnabled={isEpfEnabled}
                    isLoanEnabled={isLoanEnabled}
                    otHours={otHours}
                    salaryAdvance={salaryAdvance}
                    loanDeduction={loanDeduction}
                    handleEmployeeWorkedDaysChange={handleEmployeeWorkedDaysChange}
                    handleEmployeeOtHoursChange={handleEmployeeOtHoursChange}
                    handleEmployeeSalaryAdvanceChange={handleEmployeeSalaryAdvanceChange}
                    handleToggleLoan={handleToggleLoan}
                    handleToggleEpfEtf={handleToggleEpfEtf}
                    handleGeneratePayslip={handleGeneratePayslip}
                    openManageModal={openManageModal}
                    allowanceToggles={allowanceToggles}
                    deductionToggles={deductionToggles}
                    setAllowanceToggles={setAllowanceToggles}
                    setDeductionToggles={setDeductionToggles}
                    isSaving={isSaving}
                    hasAnyError={hasAnyError}
                    setTouchedFields={setTouchedFields}
                  />
                );
              })
            )}
          </div>

          {/* RIGHT SIDE: Payslip Preview */}
          <div className="w-5/12 flex flex-col">
            <PayslipPreview
              previewPayslip={previewPayslip}
              selectedEmployee={selectedEmployee}
              companyName={companyName}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              companyWorkingDays={companyWorkingDays}
              exportPDF={exportPDF}
              exportExcel={exportExcel}
              exportCSV={exportCSV}
            />
          </div>
        </div>

        {/* Manage Allowances / Deductions Modal */}
        <ManageSalaryModal
          manageModal={manageModal}
          modalEntries={modalEntries}
          setModalEntries={setModalEntries}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Salary;
