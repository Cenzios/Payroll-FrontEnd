import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const salaryApi = {
    saveSalary: async (data: any) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/salary`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getSalaryReport: async (companyId: string, month: number, year: number) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/reports/company-payroll-summary`, {
            params: { companyId, month, year },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
