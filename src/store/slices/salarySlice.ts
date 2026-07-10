import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SalaryDetails {
    salaryType: string;
    basicSalary: number;
    basicPay: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    totalDeductions: number;
    netSalary: number;
    workedDays: number;
    dailyRate: number;
    isEpfEnabled: boolean;
    otHours: number;
    otAmount: number;
    salaryAdvance: number;
    loanDeduction: number;
    paidLeave: number;
    epf8: number;
    epf12: number;
    etf3: number;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
    leaveDays: number;
    sickLeaveDays: number;
    nonPaidLeaveDeduction: number;
}

interface SalaryState {
    companyWorkingDays: number;
    selectedMonth: number; // 0-11
    selectedYear: number;
    // Map of employeeId -> workedDays override
    employeeWorkedDays: Record<string, number>;
    // OT and Advance overrides
    employeeOtHours: Record<string, number>;
    employeeSalaryAdvance: Record<string, number>;
    // Toggle state helper
    employeeEpfEtf: Record<string, boolean>; // Defaults to true
    employeeLoanEnabled: Record<string, boolean>; // Defaults to true
    employeeLeaveDays: Record<string, number>;
    employeeSickLeaveDays: Record<string, number>;
    // Recurring Allowances & Deductions
    employeeAllowances: Record<string, { type: string; amount: number }[]>;
    employeeDeductions: Record<string, { type: string; amount: number }[]>;
    // Preview data
    previewPayslip: SalaryDetails | null;
}

const initialState: SalaryState = {
    companyWorkingDays: new Date().getDate(),
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    employeeWorkedDays: {},
    employeeOtHours: {},
    employeeSalaryAdvance: {},
    employeeEpfEtf: {},
    employeeLoanEnabled: {},
    employeeLeaveDays: {},
    employeeSickLeaveDays: {},
    employeeAllowances: {},
    employeeDeductions: {},
    previewPayslip: null,
};

const salarySlice = createSlice({
    name: 'salary',
    initialState,
    reducers: {
        setCompanyWorkingDays: (state, action: PayloadAction<number>) => {
            state.companyWorkingDays = action.payload;
            // Clear overrides when company default changes to sync all
            state.employeeWorkedDays = {};
            state.employeeLeaveDays = {};
            state.employeeSickLeaveDays = {};
        },
        setEmployeeWorkedDays: (state, action: PayloadAction<{ id: string; days: number }>) => {
            state.employeeWorkedDays[action.payload.id] = action.payload.days;
        },
        toggleEpfEtf: (state, action: PayloadAction<{ id: string; value: boolean }>) => {
            state.employeeEpfEtf[action.payload.id] = action.payload.value;
        },
        toggleLoanEnabled: (state, action: PayloadAction<{ id: string; value: boolean }>) => {
            state.employeeLoanEnabled[action.payload.id] = action.payload.value;
        },
        setEmployeeOtHours: (state, action: PayloadAction<{ id: string; hours: number }>) => {
            state.employeeOtHours[action.payload.id] = action.payload.hours;
        },
        setEmployeeSalaryAdvance: (state, action: PayloadAction<{ id: string; advance: number }>) => {
            state.employeeSalaryAdvance[action.payload.id] = action.payload.advance;
        },
        setMonth: (state, action: PayloadAction<number>) => {
            state.selectedMonth = action.payload;
            // Optional: Clear working days or overrides when month changes?
            // Requirement says "Prevent duplicate salary: Only one salary record per employee per month"
            // It doesn't explicitly say to reset inputs, but it's good practice.
            // For now, let's keep the user's input persistence unless they navigate away or successfully save.
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.selectedYear = action.payload;
        },
        setEmployeeLeaveDays: (state, action: PayloadAction<{ id: string; days: number }>) => {
            state.employeeLeaveDays[action.payload.id] = action.payload.days;
        },
        setEmployeeSickLeaveDays: (state, action: PayloadAction<{ id: string; days: number }>) => {
            state.employeeSickLeaveDays[action.payload.id] = action.payload.days;
        },
        setEmployeeAllowances: (
            state,
            action: PayloadAction<{ id: string; allowances: { type: string; amount: number }[] }>
        ) => {
            state.employeeAllowances[action.payload.id] = action.payload.allowances;
        },
        setEmployeeDeductions: (
            state,
            action: PayloadAction<{ id: string; deductions: { type: string; amount: number }[] }>
        ) => {
            state.employeeDeductions[action.payload.id] = action.payload.deductions;
        },
        setPreviewPayslip: (state, action: PayloadAction<SalaryDetails | null>) => {
            state.previewPayslip = action.payload;
        },
        resetSalaryState: (state) => {
            state.employeeWorkedDays = {};
            state.employeeOtHours = {};
            state.employeeSalaryAdvance = {};
            state.employeeEpfEtf = {};
            state.employeeLoanEnabled = {};
            state.employeeLeaveDays = {};
            state.employeeSickLeaveDays = {};
            state.employeeAllowances = {};
            state.employeeDeductions = {};
            state.previewPayslip = null;
        }
    },
});

export const {
    setCompanyWorkingDays,
    setEmployeeWorkedDays,
    setEmployeeOtHours,
    setEmployeeSalaryAdvance,
    toggleEpfEtf,
    toggleLoanEnabled,
    setMonth,
    setYear,
    setEmployeeLeaveDays,
    setEmployeeSickLeaveDays,
    setEmployeeAllowances,
    setEmployeeDeductions,
    setPreviewPayslip,
    resetSalaryState
} = salarySlice.actions;

export default salarySlice.reducer;
