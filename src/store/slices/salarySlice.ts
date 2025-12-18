import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SalaryDetails {
    basicSalary: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    totalDeductions: number;
    netSalary: number;
    workedDays: number;
    dailyRate: number;
    isEpfEnabled: boolean;
}

interface SalaryState {
    companyWorkingDays: number;
    selectedMonth: number; // 0-11
    selectedYear: number;
    // Map of employeeId -> workedDays override
    employeeWorkedDays: Record<string, number>;
    // Toggle state helper
    employeeEpfEtf: Record<string, boolean>; // Defaults to true
    // Preview data
    previewPayslip: SalaryDetails | null;
}

const initialState: SalaryState = {
    companyWorkingDays: 30, // Default to 30 as per requirements
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    employeeWorkedDays: {},
    employeeEpfEtf: {},
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
        },
        setEmployeeWorkedDays: (state, action: PayloadAction<{ id: string; days: number }>) => {
            state.employeeWorkedDays[action.payload.id] = action.payload.days;
        },
        toggleEpfEtf: (state, action: PayloadAction<{ id: string; value: boolean }>) => {
            state.employeeEpfEtf[action.payload.id] = action.payload.value;
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
        setPreviewPayslip: (state, action: PayloadAction<SalaryDetails | null>) => {
            state.previewPayslip = action.payload;
        },
        resetSalaryState: (state) => {
            state.employeeWorkedDays = {};
            state.previewPayslip = null;
            // Keep month/year/companyDays as they might be reusable
        }
    },
});

export const {
    setCompanyWorkingDays,
    setEmployeeWorkedDays,
    toggleEpfEtf,
    setMonth,
    setYear,
    setPreviewPayslip,
    resetSalaryState
} = salarySlice.actions;

export default salarySlice.reducer;
