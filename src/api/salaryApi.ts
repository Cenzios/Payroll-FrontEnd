import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const salaryApi = {
    saveSalary: async (data: any) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/salary`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getSalaryReport: async (companyId: string, startMonth: number, startYear: number, endMonth: number, endYear: number) => {
        const token = localStorage.getItem('token');
        
        // ✅ DETAILED DEBUG LOGGING
        console.group('🔍 Salary Report API Call');
        console.log('Environment:', import.meta.env.MODE);
        console.log('API_URL:', API_URL);
        console.log('Full URL:', `${API_URL}/reports/company-payroll-summary`);
        console.log('Parameters:', {
            companyId,
            startMonth,
            startYear,
            endMonth,
            endYear
        });
        console.log('Token exists:', !!token);
        console.groupEnd();
        
        try {
            const response = await axios.get(`${API_URL}/reports/company-payroll-summary`, {
                params: { companyId, startMonth, startYear, endMonth, endYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ API Response Success:', response.data);
            return response.data;
        } catch (error: any) {
            console.group('❌ Salary Report API Error');
            console.error('Error Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            console.error('Request URL:', error.config?.url);
            console.error('Request Params:', error.config?.params);
            console.error('Request Headers:', error.config?.headers);
            console.groupEnd();
            throw error;
        }
    }
};