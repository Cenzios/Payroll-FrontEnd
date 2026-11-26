import axiosInstance from './axios';

// All calls go through the shared instance (in-memory Bearer + refresh-on-401).
export const salaryApi = {
    saveSalary: async (data: any) => {
        const response = await axiosInstance.post('/salary', data);
        return response.data;
    },

    getSalaryReport: async (companyId: string, startMonth: number, startYear: number, endMonth: number, endYear: number) => {
        try {
            const response = await axiosInstance.get('/reports/company-payroll-summary', {
                params: { companyId, startMonth, startYear, endMonth, endYear }
            });
            return response.data;
        } catch (error: any) {
            // Never log request headers here: they carry the Bearer token.
            console.error('❌ Salary Report API Error:', error.response?.status, error.response?.data);
            throw error;
        }
    },

    getCFormReport: async (companyId: string, month: number, year: number) => {
        const response = await axiosInstance.get('/reports/c-form', {
            params: { companyId, month, year }
        });
        return response.data;
    }
};
