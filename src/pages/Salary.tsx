import React, { useState, useEffect } from "react";
import { Search, Calendar } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  useGetEmployeesQuery,
  useGetCompaniesQuery,
  useGetAllPendingLoanInstallmentsQuery,
  useGetSalaryHistoryQuery,
  useSaveSalaryMutation,
  useUpdateEmployeeMutation,
} from "../store/apiSlice";
import { Employee } from "../types/employee.types";
import type { SalaryRecord } from "../types/salary.types";
import { isPositive, sanitizeMoneyInput, toDecimal, toDecimalString, toMoneyString } from "../utils/money";
import { calculateEarningsLimit, calculatePayslip, salaryLimitError, wouldNetSalaryBeNegative } from "../utils/salaryCalc";
import { buildPreviewDetails, buildSavedDetails, installmentRemaining } from "../utils/payslipDetails";
import Toast from "../components/Toast";
import SalaryListSkeleton from "../components/skeletons/SalaryListSkeleton";
import PageHeader from "../components/PageHeader";
import { exportPayslip } from "../utils/exportService";
import {
  setCompanyWorkingDays,
  setEmployeeWorkedDays,
  setEmployeeOtHours,
  setEmployeeSalaryAdvance,
  toggleEpfEtf,
  toggleLoanEnabled,
  setPreviewPayslip,
  setYear,
  setEmployeeLeaveDays,
  setEmployeeSickLeaveDays,
  setEmployeeAllowances,
  setEmployeeDeductions,
  setMonth,
  resetSalaryState,
  SalaryEntry,
} from "../store/slices/salarySlice";
import EmployeeSalaryCard from "../components/EmployeeSalaryCard";
import PayslipPreview from "../components/PayslipPreview";
import ManageSalaryModal from "../components/ManageSalaryModal";
import AlertBar from "../components/AlertBar";
import logo from '../assets/images/logo-login.svg';

/** Recurring items are only stored while the employee's allowance / deduction toggle is on. */
const canSaveRecurring = (type: "allowance" | "deduction", emp: Employee | undefined): boolean =>
  !emp || (type === "allowance" ? emp.allowanceEnabled : emp.deductionEnabled);

const recurringDisabledMessage = (type: "allowance" | "deduction"): string =>
  type === "allowance"
    ? "Applied to this salary only. Allowances are turned off for this employee: enable allowances in Employees > Edit to save recurring allowances."
    : "Applied to this salary only. Deductions are turned off for this employee: enable deductions in Employees > Edit to save recurring deductions.";

const Salary = () => {
  const dispatch = useAppDispatch();
  const { selectedCompanyId, user } = useAppSelector((state) => state.auth);
  const {
    companyWorkingDays,
    employeeWorkedDays,
    employeeOtHours,
    employeeSalaryAdvance,
    employeeEpfEtf,
    employeeLoanEnabled,
    employeeLeaveDays,
    employeeSickLeaveDays,
    employeeAllowances,
    employeeDeductions,
    previewPayslip,
    selectedMonth,
    selectedYear,
  } = useAppSelector((state) => state.salary);

  const [search, setSearch] = useState("");

  // Selection State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [saveSalary, { isLoading: isSaving }] = useSaveSalaryMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();

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

  // Create a map of employeeId -> remaining loan installment total (decimal string)
  const employeeLoanMap = (allPendingLoans || []).reduce(
    (map: Record<string, string>, inst) => {
      const empId = inst.loan?.employeeId;
      if (empId) {
        map[empId] = toDecimal(map[empId]).plus(installmentRemaining(inst)).toFixed(4);
      }
      return map;
    },
    {},
  );

  // Fetch Salary History for the current month
  const { data: salaryHistory, isFetching: isFetchingHistory } = useGetSalaryHistoryQuery(
    {
      companyId: selectedCompanyId || "",
      month: selectedMonth + 1,
      year: selectedYear,
    },
    {
      skip: !selectedCompanyId,
    },
  );

  // Map generated salaries by employee ID
  const generatedSalaries = (salaryHistory || []).reduce((acc: Record<string, SalaryRecord>, record) => {
    acc[record.employeeId] = record;
    return acc;
  }, {});

  // Allowance / Deduction local state per employee
  const [allowanceToggles, setAllowanceToggles] = useState<
    Record<string, boolean>
  >({});
  const [deductionToggles, setDeductionToggles] = useState<
    Record<string, boolean>
  >({});

  // Manage modal state
  const [manageModal, setManageModal] = useState<{
    type: "allowance" | "deduction";
    empId: string;
    emp?: Employee;
  } | null>(null);
  const [modalEntries, setModalEntries] = useState<SalaryEntry[]>([]);
  const [saveAsRecurring, setSaveAsRecurring] = useState(false);

  const openManageModal = (type: "allowance" | "deduction", emp: Employee) => {
    const empId = emp.id;
    let existing =
      type === "allowance"
        ? employeeAllowances[empId] || []
        : employeeDeductions[empId] || [];

    // Populate from DB if not edited locally yet
    if (existing.length === 0) {
      if (
        type === "allowance" &&
        emp.recurringAllowances &&
        emp.recurringAllowances.length > 0
      ) {
        existing = emp.recurringAllowances.map((a) => ({
          type: a.type,
          amount: toDecimalString(a.amount),
        }));
        dispatch(setEmployeeAllowances({ id: empId, allowances: existing }));
      } else if (
        type === "deduction" &&
        emp.recurringDeductions &&
        emp.recurringDeductions.length > 0
      ) {
        existing = emp.recurringDeductions.map((d) => ({
          type: d.type,
          amount: toDecimalString(d.amount),
        }));
        dispatch(setEmployeeDeductions({ id: empId, deductions: existing }));
      }
    }

    setModalEntries([...existing, { type: "", amount: "" }]);
    setSaveAsRecurring(false); // one-off for this salary unless the user opts in
    setManageModal({ type, empId, emp });
  };

  const handleModalSave = async () => {
    if (!manageModal) return;
    const validEntries = modalEntries
      .filter((e) => e.type.trim() && isPositive(e.amount))
      .map((e) => ({ type: e.type, amount: toDecimalString(e.amount) }));

    const { type, empId } = manageModal;

    // Redux holds the items for THIS salary run (used when the payslip is generated)
    if (type === "allowance") {
      dispatch(setEmployeeAllowances({ id: empId, allowances: validEntries }));
    } else {
      dispatch(setEmployeeDeductions({ id: empId, deductions: validEntries }));
    }

    setManageModal(null);
    setModalEntries([]);

    // Only change the employee's recurring items when explicitly asked to
    if (!saveAsRecurring || !selectedCompanyId) return;
    if (!canSaveRecurring(type, manageModal.emp)) {
      // Nothing is stored while the toggle is off: never show a success toast
      setToast({ message: recurringDisabledMessage(type), type: "error" });
      return;
    }
    try {
      await updateEmployee({
        id: empId,
        companyId: selectedCompanyId,
        data:
          type === "allowance"
            ? { recurringAllowances: validEntries }
            : { recurringDeductions: validEntries },
      }).unwrap();
      setToast({ message: `Saved as recurring ${type}s for this employee`, type: "success" });
    } catch (error: any) {
      setToast({
        message: error.data?.message || `Failed to save ${type}s`,
        type: "error",
      });
    }
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

  // --- Reset state when month/year changes ---
  useEffect(() => {
    // Clear Redux overrides
    dispatch(resetSalaryState());

    // Clear local functional states
    setAllowanceToggles({});
    setDeductionToggles({});
    setTouchedFields({
      month: false,
      companyDays: false,
      employeeDays: {},
    });
    setSelectedEmployee(null);
  }, [selectedMonth, selectedYear, dispatch]);

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
    const salaryAdvance = employeeSalaryAdvance[empId] ?? "0";
    const leaveDays = employeeLeaveDays[empId] ?? 0;
    const sickLeaveDays = employeeSickLeaveDays[empId] ?? 0;
    const hasLoanInstallment = !toDecimal(employeeLoanMap[empId]).isZero();
    const loanDeduction = (isLoanEnabled && hasLoanInstallment) ? employeeLoanMap[empId] || "0" : "0";
    return {
      workedDays,
      isEpfEnabled,
      isLoanEnabled,
      otHours,
      salaryAdvance,
      leaveDays,
      sickLeaveDays,
      loanDeduction,
      hasLoanInstallment,
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

  // Max worked days an employee can log for the selected month, capped by their joined date.
  const getEmployeeMaxWorkedDays = (emp: Employee, year: number, month: number, maxCompanyDays: number) => {
    const joinedDate = new Date(emp.joinedDate);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth();
    const joinedDay = joinedDate.getDate();

    // Only relevant if the employee joined in the currently selected month
    if (year === joinedYear && month === joinedMonth) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const availableDaysSinceJoining = daysInMonth - joinedDay + 1; // joined day counts as day 1
      return Math.max(0, Math.min(maxCompanyDays, availableDaysSinceJoining));
    }

    return maxCompanyDays;
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

  const validEmployees = employees
    .filter(emp => !isBeforeJoinedDate(emp, selectedYear, selectedMonth))
    .sort((a, b) => {
      const isALocked = !!generatedSalaries[a.id];
      const isBLocked = !!generatedSalaries[b.id];
      if (isALocked && !isBLocked) return 1;
      if (!isALocked && isBLocked) return -1;
      return 0;
    });

  // Check if ANY validation error exists (for button disable)
  const hasAnyError = (emp: Employee) => {
    if (isFutureMonth) return true;
    if (isBeforeJoinedDate(emp, selectedYear, selectedMonth)) return true;
    if (companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays)
      return true;
    const { workedDays, otHours, salaryAdvance, isEpfEnabled, isLoanEnabled, loanDeduction, leaveDays, sickLeaveDays } = getEmployeeValues(emp.id);
    const maxWorkedDaysForEmp = getEmployeeMaxWorkedDays(emp, selectedYear, selectedMonth, companyWorkingDays);
    if (workedDays < 0 || workedDays > maxWorkedDaysForEmp) return true;
    if (salaryLimitError({ employeeStatus: emp.status, companyWorkingDays, workedDays, leaveDays, sickLeaveDays, otHours })) return true;
    if (workedDays + leaveDays + sickLeaveDays !== companyWorkingDays) return true;

    // Check for negative net salary (decimal.js)
    return wouldNetSalaryBeNegative(emp, {
      companyWorkingDays,
      workedDays,
      leaveDays,
      sickLeaveDays,
      otHours,
      salaryAdvance,
      isEpfEnabled,
      loanDeduction: isLoanEnabled ? loanDeduction : "0",
      allowances: employeeAllowances[emp.id] || emp.recurringAllowances || [],
      deductions: employeeDeductions[emp.id] || emp.recurringDeductions || [],
    });
  };

  const handleCompanyWorkingDaysChange = (val: number) => {
    setTouchedFields((prev) => ({ ...prev, companyDays: true }));
    const maxVal = getMaxAllowedDays(selectedYear, selectedMonth);
    const clippedVal = Math.min(Math.max(0, val), maxVal);
    dispatch(setCompanyWorkingDays(clippedVal));
  };

  const handleEmployeeWorkedDaysChange = (empId: string, val: number) => {
    setTouchedFields((prev) => ({
      ...prev,
      employeeDays: { ...prev.employeeDays, [empId]: true },
    }));
    // const { sickLeaveDays } = getEmployeeValues(empId);
    const { leaveDays } = getEmployeeValues(empId);
    const emp = employees.find((e) => e.id === empId);
    const maxDays = emp
      ? getEmployeeMaxWorkedDays(emp, selectedYear, selectedMonth, companyWorkingDays)
      : companyWorkingDays;
    const clippedVal = Math.min(Math.max(0, val), maxDays);
    dispatch(setEmployeeWorkedDays({ id: empId, days: clippedVal }));

    // Recalc paid leave = total - worked - unpaid (not the other way)
    // const autoPaidLeave = Math.max(0, companyWorkingDays - clippedVal - sickLeaveDays);
    // dispatch(setEmployeeLeaveDays({ id: empId, days: autoPaidLeave }));
    const autoUnpaidLeave = Math.max(0, companyWorkingDays - clippedVal - leaveDays);
    dispatch(setEmployeeSickLeaveDays({ id: empId, days: autoUnpaidLeave }));
  };

  const handleMonthChange = (month: number) => {
    setTouchedFields((prev) => ({ ...prev, month: true }));
    dispatch(setMonth(month));
    dispatch(setCompanyWorkingDays(getMaxAllowedDays(selectedYear, month)));
  };

  const handleYearChange = (year: number) => {
    setTouchedFields((prev) => ({ ...prev, month: true }));

    // Prevent keeping a future month if year is changed to current
    let targetMonth = selectedMonth;
    const now = new Date();
    if (year === now.getFullYear() && selectedMonth > now.getMonth()) {
      targetMonth = now.getMonth();
      dispatch(setMonth(targetMonth));
    }

    dispatch(setYear(year));
    dispatch(setCompanyWorkingDays(getMaxAllowedDays(year, targetMonth)));
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
    const capped = Math.min(Math.max(0, val), 744);
    dispatch(setEmployeeOtHours({ id: empId, hours: capped }));
  };

  /** Advance stays a decimal string (up to 7 integer digits, 2 decimals); never parsed to a number. */
  const handleEmployeeSalaryAdvanceChange = (empId: string, raw: string): void => {
    const value = sanitizeMoneyInput(raw, 7);
    if (value === null) return;
    dispatch(setEmployeeSalaryAdvance({ id: empId, advance: value === "" ? "0" : value }));
  };

  const handleEmployeeLeaveDaysChange = (empId: string, val: number) => {
    const { sickLeaveDays } = getEmployeeValues(empId);
    const maxPaid = Math.max(0, companyWorkingDays - sickLeaveDays);
    const clippedVal = Math.min(Math.max(0, val), maxPaid);
    dispatch(setEmployeeLeaveDays({ id: empId, days: clippedVal }));
    const autoWorked = Math.max(0, companyWorkingDays - clippedVal - sickLeaveDays);
    dispatch(setEmployeeWorkedDays({ id: empId, days: autoWorked }));
  };

  const handleEmployeeSickLeaveDaysChange = (empId: string, val: number) => {
    const { leaveDays } = getEmployeeValues(empId);
    const maxUnpaid = Math.max(0, companyWorkingDays - leaveDays);
    const clippedVal = Math.min(Math.max(0, val), maxUnpaid);
    dispatch(setEmployeeSickLeaveDays({ id: empId, days: clippedVal }));
    const autoWorked = Math.max(0, companyWorkingDays - leaveDays - clippedVal);
    dispatch(setEmployeeWorkedDays({ id: empId, days: autoWorked }));
  };

  // Handle Generate process (Preview or Save)
  const processPayslip = async (emp: Employee, saveToDb: boolean = false) => {
    setSelectedEmployee(emp);

    const {
      workedDays,
      isEpfEnabled,
      isLoanEnabled,
      otHours,
      salaryAdvance,
      leaveDays,
      sickLeaveDays,
      loanDeduction,
      hasLoanInstallment,
    } = getEmployeeValues(emp.id);
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
    // Same day / hour / status limits the API enforces (422)
    const limitError = salaryLimitError({
      employeeStatus: emp.status, companyWorkingDays, workedDays, leaveDays, sickLeaveDays, otHours,
    });
    if (limitError) {
      setToast({ message: limitError, type: "error" });
      return;
    }

    const currentAllowances = employeeAllowances[emp.id] || emp.recurringAllowances || [];
    const currentDeductions = employeeDeductions[emp.id] || emp.recurringDeductions || [];

    // All money maths via decimal.js (see utils/salaryCalc.ts)
    const amounts = calculatePayslip(emp, {
      companyWorkingDays,
      workedDays,
      leaveDays,
      sickLeaveDays,
      otHours,
      salaryAdvance,
      isEpfEnabled,
      loanDeduction,
      allowances: currentAllowances,
      deductions: currentDeductions,
    });

    const details = buildPreviewDetails({
      emp,
      amounts,
      workedDays,
      otHours,
      salaryAdvance,
      leaveDays,
      sickLeaveDays,
      loanDeduction,
      isEpfEnabled,
      allowances: currentAllowances,
      deductions: currentDeductions,
      loanInstallments: (isLoanEnabled && hasLoanInstallment)
        ? (allPendingLoans || []).filter((inst) => inst.loan?.employeeId === emp.id)
        : [],
      ordinal: getOrdinalSuffix,
    });

    dispatch(setPreviewPayslip(details));

    // Save to DB
    if (saveToDb) {
      if (!selectedCompanyId) return;
      try {
        // Money is sent as decimal strings (API contract)
        await saveSalary({
          companyId: selectedCompanyId,
          employeeId: emp.id,
          month: selectedMonth + 1,
          year: selectedYear,
          workingDays: workedDays,
          basicPay: toMoneyString(amounts.basicPay),
          otHours: toDecimalString(otHours),
          otAmount: toMoneyString(amounts.otAmount),
          salaryAdvance: toMoneyString(salaryAdvance),
          employeeEPF: toMoneyString(amounts.epfEmployee),
          employerEPF: toMoneyString(amounts.epfEmployer),
          etfAmount: toMoneyString(amounts.etfEmployer),
          netSalary: toMoneyString(amounts.netSalary),
          loanDeduction: toMoneyString(loanDeduction),
          isLoanEnabled,
          isEpfEnabled: emp.epfEnabled && isEpfEnabled,
          companyWorkingDays: companyWorkingDays,
          leaveDays: Math.min(leaveDays, emp.paidLeave || 0),
          nonPaidLeaveDeduction: toMoneyString(amounts.nonPaidLeaveDeduction),
          sickLeaveDays: sickLeaveDays,
          allowances: currentAllowances.map(a => ({ type: a.type, amount: toMoneyString(a.amount) })),
          deductions: currentDeductions.map(d => ({ type: d.type, amount: toMoneyString(d.amount) })),
        }).unwrap();
        setToast({ message: "Salary saved successfully!", type: "success" });
      } catch (error: any) {
        setToast({
          message: error.data?.message || "Failed to save salary",
          type: "error",
        });
      }
    } // end saveToDb
  };

  const handleGeneratePayslip = async (emp: Employee) => {
    const savedRecord = generatedSalaries[emp.id];
    if (savedRecord) {
      setSelectedEmployee(emp);
      const details = buildSavedDetails(savedRecord, companyWorkingDays);
      dispatch(setPreviewPayslip(details));
      return;
    }

    await processPayslip(emp, false);
  };

  const handleConfirmPayslip = async (emp: Employee) => {
    await processPayslip(emp, true);
  };

  const handleSelectEmployee = (emp: Employee) => {
    if (selectedEmployee?.id === emp.id) {
      setSelectedEmployee(null);
      dispatch(setPreviewPayslip(null));
    } else {
      setSelectedEmployee(emp);
      dispatch(setPreviewPayslip(null));
    }
  };

  // Export Functions
  const exportPDF = () => {
    if (!previewPayslip || !selectedEmployee) return;
    exportPayslip("pdf", {
      previewPayslip,
      selectedEmployee,
      companyName,
      companyAddress: selectedCompany?.address || "",
      selectedMonth,
      selectedYear,
      companyWorkingDays,
    });
  };

  const exportExcel = () => {
    if (!previewPayslip || !selectedEmployee) return;
    exportPayslip("excel", {
      previewPayslip,
      selectedEmployee,
      companyName,
      companyAddress: selectedCompany?.address || "",
      selectedMonth,
      selectedYear,
      companyWorkingDays,
    });
  };

  const exportCSV = () => {
    if (!previewPayslip || !selectedEmployee) return;
    exportPayslip("csv", {
      previewPayslip,
      selectedEmployee,
      companyName,
      companyAddress: selectedCompany?.address || "",
      selectedMonth,
      selectedYear,
      companyWorkingDays,
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
      <AlertBar />

      {/* Margin bottom gap after the banner */}
      <div className="-mb-4 shrink-0"></div>

      <div className="flex flex-1 overflow-hidden relative w-full translate-x-0 md:translate-x-0">
        <Sidebar />

        <div className="flex-1 ml-0 sm:ml-64 sm:p-6 h-screen overflow-hidden flex flex-col max-sm:overflow-y-auto max-sm:h-auto">

          {/* MOBILE HEADER */}
          <div className="hidden mt-6 max-sm:flex items-center justify-between pt-5  border-b border-gray-100">
            <div>
              <img src={logo} alt="logo" className='w-40 h-10' />
            </div>
            <div className="flex items-center gap-2 ml-6">

              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full mr-5 bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>

          {/* Mobile Title & Action */}
          <div className="hidden max-sm:block px-6 py-2 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className='px-3'>
                <div className="inline-block rounded-sm">
                  <h1 className="text-[22px] font-bold text-[#1D1F24]">Salary</h1>
                </div>
                <p className="text-[13px] text-[#989FA7] font-medium">View and Calculate Employee Salaries</p>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="shrink-0 max-sm:hidden">
            <PageHeader
              title="Salary"
              subtitle="View and Calculate Employee Salaries"
            />
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden max-sm:overflow-visible max-sm:px-6">

            {/* LEFT SIDE */}
            <div className="w-full md:w-10/12 flex flex-col overflow-hidden max-sm:overflow-visible">

              {/* FILTER BOX */}
              <div className="bg-white gap-4 md:gap-8 p-4 md:p-7 w-full rounded-xl mb-6 flex flex-col md:flex-row md:flex-wrap border border-gray-200">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-800 mb-2">
                    Search Employee
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by Name or ID"
                      className="bg-gray-50 pl-10 pr-4 py-2 rounded-lg text-sm text-gray-700 font-medium border border-gray-300 outline-none w-full md:w-80"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 max-sm:gap-4">
                  <div className="flex flex-col min-w-[100px]">
                    <label className="text-sm font-medium text-gray-800 mb-2">
                      Select Month
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        views={['month', 'year']}
                        value={dayjs(new Date(selectedYear, selectedMonth))}
                        maxDate={dayjs(new Date())}
                        onChange={(newValue) => {
                          if (newValue && newValue.isValid()) {
                            handleYearChange(newValue.year());
                            handleMonthChange(newValue.month());
                          }
                        }}
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: {
                              backgroundColor: "white",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "0.75rem",
                                "& fieldset": {
                                  borderColor: "#374151",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#374151",
                                  borderWidth: "1px",
                                },
                              },
                              "& .MuiInputBase-input": {
                                paddingY: "9.5px",
                                paddingX: "14px",
                                fontSize: "0.875rem",
                                color: "#1f2937",
                              }
                            }
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  {/* Working Days */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-800 mb-2">
                      Working Days
                    </label>
                    <div className="relative flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="number"
                        min="1"
                        max={maxAllowedCompanyDays}
                        value={companyWorkingDays}
                        onChange={(e) =>
                          handleCompanyWorkingDaysChange(
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-12 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center text-sm font-medium text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                key={`${selectedMonth}-${selectedYear}`}
                className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-sm:overflow-visible max-sm:pb-20"
              >
                {isLoading ? (
                  <SalaryListSkeleton />
                ) : validEmployees.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">
                    No employees found.
                  </div>
                ) : (
                  validEmployees.map((emp, index) => {
                    const {
                      workedDays,
                      isEpfEnabled,
                      isLoanEnabled,
                      otHours,
                      salaryAdvance,
                      leaveDays,
                      sickLeaveDays,
                      loanDeduction,
                      hasLoanInstallment,
                    } = getEmployeeValues(emp.id);

                    const maxWorkedDaysForEmp = getEmployeeMaxWorkedDays(emp, selectedYear, selectedMonth, companyWorkingDays);

                    return (
                      <div
                        key={emp.id}
                        className="animate-in fade-in slide-in-from-bottom-5 duration-700"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <EmployeeSalaryCard
                          emp={emp}
                          generatedSalary={generatedSalaries[emp.id]}
                          selectedEmployee={selectedEmployee}
                          handleSelectEmployee={handleSelectEmployee}
                          workedDays={workedDays}
                          isEpfEnabled={isEpfEnabled}
                          isLoanEnabled={isLoanEnabled}
                          otHours={otHours}
                          salaryAdvance={salaryAdvance}
                          leaveDays={leaveDays}
                          sickLeaveDays={sickLeaveDays}
                          loanDeduction={loanDeduction}
                          companyWorkingDays={companyWorkingDays}
                          maxWorkedDays={maxWorkedDaysForEmp}
                          hasLoanInstallment={hasLoanInstallment}
                          handleEmployeeWorkedDaysChange={handleEmployeeWorkedDaysChange}
                          handleEmployeeOtHoursChange={handleEmployeeOtHoursChange}
                          handleEmployeeSalaryAdvanceChange={handleEmployeeSalaryAdvanceChange}
                          handleEmployeeLeaveDaysChange={handleEmployeeLeaveDaysChange}
                          handleEmployeeSickLeaveDaysChange={handleEmployeeSickLeaveDaysChange}
                          handleToggleLoan={handleToggleLoan}
                          handleToggleEpfEtf={handleToggleEpfEtf}
                          handleGeneratePayslip={handleGeneratePayslip}
                          handleConfirmPayslip={handleConfirmPayslip}
                          openManageModal={openManageModal}
                          salaryAllowances={employeeAllowances}
                          salaryDeductions={employeeDeductions}
                          isSaving={isSaving}
                          hasAnyError={hasAnyError}
                          setTouchedFields={setTouchedFields}
                          selectedMonth={selectedMonth}
                          selectedYear={selectedYear}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className={`
  fixed md:relative inset-0 md:inset-auto z-40 md:z-auto
  w-full md:w-5/12
  h-full
  flex flex-col overflow-y-auto
  bg-white md:bg-transparent
  transition-transform duration-300
  ${selectedEmployee && previewPayslip ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
`}>

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
                onClose={() => {
                  setSelectedEmployee(null);
                  dispatch(setPreviewPayslip(null));
                }}
              />
            </div>
          </div>

          {/* MODAL */}
          <ManageSalaryModal
            manageModal={manageModal}
            modalEntries={modalEntries}
            setModalEntries={setModalEntries}
            onSave={handleModalSave}
            onCancel={handleModalCancel}
            saveAsRecurring={saveAsRecurring}
            onSaveAsRecurringChange={setSaveAsRecurring}
            canSaveAsRecurring={manageModal ? canSaveRecurring(manageModal.type, manageModal.emp) : true}
            earningsLimit={(() => {
              if (!manageModal || manageModal.type !== "deduction" || !manageModal.emp) return undefined;
              const emp = manageModal.emp;
              const { workedDays, otHours, leaveDays, sickLeaveDays } = getEmployeeValues(emp.id);
              return calculateEarningsLimit(
                emp,
                { companyWorkingDays, workedDays, leaveDays, sickLeaveDays, otHours },
                employeeAllowances[emp.id] || emp.recurringAllowances || [],
              ).toFixed(4);
            })()}
          />

          {/* TOAST */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div >
    </div>
  );
};

export default Salary;