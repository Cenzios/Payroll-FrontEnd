import axiosInstance from './axios';
import type { EmployeePayrollSummary, SelectedEmployeesSummary } from '../types/report.types';

/** Standard API envelope; money fields inside `data` are decimal strings. */
export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

export const reportApi = {
    /**
     * Get employee payroll summary for the entire year
     * @param employeeId - UUID of the employee
     * @param companyId - UUID of the company
     * @returns Employee info and monthly salary breakdown
     */
    getEmployeePayrollSummary: async (employeeId: string, companyId: string, month: number, year: number): Promise<ApiEnvelope<EmployeePayrollSummary>> => {
        const response = await axiosInstance.get<ApiEnvelope<EmployeePayrollSummary>>('/reports/employee-payroll-summary', {
            params: {
                employeeId,
                companyId,
                month,
                year
            }
        });
        return response.data;
    },

    /**
     * Get selected employees payroll summary
     * @param companyId - UUID of the company
     * @param employeeIds - Array of employee UUIDs
     * @param month - Month number (1-12)
     * @param year - Year
     * @returns Combined payroll summary for selected employees
     */
    getSelectedEmployeesSummary: async (
        companyId: string,
        employeeIds: string[],
        month: number,
        year: number
    ): Promise<ApiEnvelope<SelectedEmployeesSummary>> => {
        const response = await axiosInstance.post<ApiEnvelope<SelectedEmployeesSummary>>(
            '/reports/selected-employees-summary',
            { companyId, employeeIds, month, year }
        );
        return response.data;
    }
};
