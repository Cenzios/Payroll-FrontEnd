import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Calculator,
  Calendar,
} from "lucide-react";
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
} from "../store/apiSlice";
import { salaryApi } from "../api/salaryApi";
import { Employee } from "../types/employee.types";
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
  const generatedSalaries = (salaryHistory || []).reduce((acc: any, record: any) => {
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
    const hasLoanInstallment = !!employeeLoanMap[empId];
    const loanDeduction = (isLoanEnabled && hasLoanInstallment) ? employeeLoanMap[empId] || 0 : 0;
    return {
      workedDays,
      isEpfEnabled,
      isLoanEnabled,
      otHours,
      salaryAdvance,
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
    const { workedDays, otHours, salaryAdvance, isEpfEnabled, isLoanEnabled, loanDeduction } = getEmployeeValues(emp.id);
    if (workedDays < 0 || workedDays > companyWorkingDays) return true;

    // Check for negative net salary
    const otRate = emp.otRate || 0;
    const otAmount = emp.otRate > 0 ? otHours * otRate : 0;
    const basicPay = emp.salaryType === "MONTHLY"
      ? (companyWorkingDays > 0 ? (emp.basicSalary / companyWorkingDays) * workedDays : 0)
      : emp.basicSalary * workedDays;

    const epfAmount = emp.epfEnabled && isEpfEnabled ? basicPay * 0.08 : 0;
    const totalEarnings = basicPay + otAmount + (salaryAllowances[emp.id] || emp.recurringAllowances || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const otherDeductions = epfAmount + (isLoanEnabled ? loanDeduction : 0) + (salaryDeductions[emp.id] || emp.recurringDeductions || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);

    if (totalEarnings - (otherDeductions + salaryAdvance) < 0) return true;
    return false;
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
    const clippedVal = Math.min(Math.max(0, val), companyWorkingDays);
    dispatch(setEmployeeWorkedDays({ id: empId, days: clippedVal }));
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
    dispatch(setEmployeeOtHours({ id: empId, hours: Math.max(0, val) }));
  };

  const handleEmployeeSalaryAdvanceChange = (empId: string, val: number) => {
    dispatch(setEmployeeSalaryAdvance({ id: empId, advance: Math.max(0, val) }));
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
      loanDeduction,
      hasLoanInstallment,
    } = getEmployeeValues(emp.id);
    const otAmount = emp.otRate > 0 ? otHours * (emp.otRate || 0) : 0;

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
      basicPay = (basicSalaryForCalc / companyWorkingDays) * (workedDays + (emp.paidLeave || 0));
    } else {
      basicPay = basicSalaryForCalc * workedDays;
    }

    const currentAllowances = salaryAllowances[emp.id] || emp.recurringAllowances || [];
    const currentDeductions = salaryDeductions[emp.id] || emp.recurringDeductions || [];

    const allowanceAmount = currentAllowances.reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0,
    );
    const deductionAmount = currentDeductions.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0,
    );

    // Calculations
    let epfEmployee = 0;
    let epfEmployer = basicPay * 0.12;
    let etfEmployer = basicPay * 0.03;

    if (emp.epfEnabled && isEpfEnabled) {
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
      paidLeave: emp.paidLeave || 0,
      dailyRate: emp.salaryType === "MONTHLY" ? ((emp.basicSalary || 0) / companyWorkingDays) : (emp.basicSalary || 0),
      deductions: [
        { name: "Salary Advance", amount: salaryAdvance },
        ...currentDeductions.map((d) => ({
          name: d.type,
          amount: Number(d.amount),
        })),
        ...((isLoanEnabled && hasLoanInstallment)
          ? (allPendingLoans || []).filter(
            (inst: any) => inst.loan?.employeeId === emp.id,
          )
          : []
        ).map((inst: any) => ({
          name: `Loan Installment: ${inst.loan?.loanTitle} (${getOrdinalSuffix(inst.installmentNumber)} installment)`,
          amount: inst.amount - (inst.paidAmount || 0),
        })),
      ],
      allowances: currentAllowances.map((a) => ({
        name: a.type,
        amount: Number(a.amount),
      })),
    };

    dispatch(setPreviewPayslip(details));

    // Save to DB
    if (saveToDb) {
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
          allowances: currentAllowances.map(a => ({ type: a.type, amount: Number(a.amount) })),
          deductions: currentDeductions.map(d => ({ type: d.type, amount: Number(d.amount) })),
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
    } // end saveToDb
  };

  const handleGeneratePayslip = async (emp: Employee) => {
    const savedRecord = generatedSalaries[emp.id];
    if (savedRecord) {
      setSelectedEmployee(emp);
      const details = {
        basicSalary: savedRecord.basicSalary || 0,
        salaryType: savedRecord.salaryType || "DAILY",
        basicPay: savedRecord.basicPay,
        epfEmployee: savedRecord.employeeEPF,
        epfEmployer: savedRecord.employerEPF,
        etfEmployer: savedRecord.etfAmount,
        tax: savedRecord.employeeTaxAmount,
        totalDeductions: savedRecord.totalDeduction,
        netSalary: savedRecord.netSalary,
        workedDays: savedRecord.workingDays,
        isEpfEnabled: savedRecord.employeeEPF > 0 || savedRecord.employerEPF > 0,
        otHours: savedRecord.otHours,
        otAmount: savedRecord.otAmount,
        salaryAdvance: savedRecord.salaryAdvance,
        loanDeduction: savedRecord.loanDeduction,
        epf8: savedRecord.employeeEPF,
        epf12: savedRecord.employerEPF,
        etf3: savedRecord.etfAmount,
        paidLeave: savedRecord.paidLeave || 0,
        dailyRate: savedRecord.salaryType === "MONTHLY" ? ((savedRecord.basicSalary || 0) / companyWorkingDays) : (savedRecord.basicSalary || 0),
        deductions: [
          ...(savedRecord.salaryAdvance > 0 ? [{ name: "Salary Advance", amount: savedRecord.salaryAdvance }] : []),
          ...(savedRecord.loanDeduction > 0 ? [{ name: "Loan Deduction", amount: savedRecord.loanDeduction }] : []),
          ...(savedRecord.deductions || []).map((d: any) => ({ name: d.type, amount: d.amount })),
        ],
        allowances: (savedRecord.allowances || []).map((a: any) => ({ name: a.type, amount: a.amount })),
      };
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
    } else {
      setSelectedEmployee(emp);
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0">
          <PageHeader
            title="Salary"
            subtitle="View and Calculate Employee Salaries"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex gap-6 flex-1 overflow-hidden">

          {/* LEFT SIDE */}
          <div className="w-10/12 flex flex-col overflow-hidden">

            {/* FILTER BOX */}
            <div className="bg-white gap-14 p-7 w-full rounded-xl mb-6 flex flex-row border border-gray-200">
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
                    className="bg-gray-50 pl-10 pr-4 py-2 rounded-lg text-sm text-gray-700 font-medium border border-gray-300 outline-none w-80"
                  />
                </div>
              </div>

              <div className="flex flex-col max-w-xs min-w-[200px]">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
                  Select Period
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
                              borderColor: "#e5e7eb",
                              transition: "all 0.2s ease-in-out",
                            },
                            "&:hover fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#3b82f6",
                              borderWidth: "1px",
                              boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
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

            {/* EMPLOYEE LIST */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isLoading ? (
                <SalaryListSkeleton />
              ) : validEmployees.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                  No employees found.
                </div>
              ) : (
                validEmployees.map((emp) => {
                  const {
                    workedDays,
                    isEpfEnabled,
                    isLoanEnabled,
                    otHours,
                    salaryAdvance,
                    loanDeduction,
                    hasLoanInstallment,
                  } = getEmployeeValues(emp.id);

                  return (
                    <EmployeeSalaryCard
                      key={emp.id}
                      emp={emp}
                      generatedSalary={generatedSalaries[emp.id]}
                      selectedEmployee={selectedEmployee}
                      handleSelectEmployee={handleSelectEmployee}
                      workedDays={workedDays}
                      isEpfEnabled={isEpfEnabled}
                      isLoanEnabled={isLoanEnabled}
                      otHours={otHours}
                      salaryAdvance={salaryAdvance}
                      loanDeduction={loanDeduction}
                      companyWorkingDays={companyWorkingDays}
                      hasLoanInstallment={hasLoanInstallment}
                      handleEmployeeWorkedDaysChange={handleEmployeeWorkedDaysChange}
                      handleEmployeeOtHoursChange={handleEmployeeOtHoursChange}
                      handleEmployeeSalaryAdvanceChange={handleEmployeeSalaryAdvanceChange}
                      handleToggleLoan={handleToggleLoan}
                      handleToggleEpfEtf={handleToggleEpfEtf}
                      handleGeneratePayslip={handleGeneratePayslip}
                      handleConfirmPayslip={handleConfirmPayslip}
                      openManageModal={openManageModal}
                      salaryAllowances={salaryAllowances}
                      salaryDeductions={salaryDeductions}
                      isSaving={isSaving}
                      hasAnyError={hasAnyError}
                      setTouchedFields={setTouchedFields}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-5/12 flex flex-col overflow-y-auto">
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

        {/* MODAL */}
        <ManageSalaryModal
          manageModal={manageModal}
          modalEntries={modalEntries}
          setModalEntries={setModalEntries}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
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
  );
};

export default Salary;