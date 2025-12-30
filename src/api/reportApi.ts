import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const reportApi = {
    /**
     * Get employee payroll summary for the entire year
     * @param employeeId - UUID of the employee
     * @param companyId - UUID of the company
     * @returns Employee info and monthly salary breakdown
     */
    getEmployeePayrollSummary: async (employeeId: string, companyId: string) => {
        const token = localStorage.getItem('token');
        const currentYear = new Date().getFullYear();

        const response = await axios.get(`${API_URL}/reports/employee-payroll-summary`, {
            params: {
                employeeId,
                companyId,
                year: currentYear
            },
            headers: { Authorization: `Bearer ${token}` }
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
    ) => {
        const token = localStorage.getItem('token');

        const response = await axios.post(
            `${API_URL}/reports/selected-employees-summary`,
            { companyId, employeeIds, month, year },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }
};
