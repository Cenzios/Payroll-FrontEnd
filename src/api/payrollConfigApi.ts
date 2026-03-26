import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/payroll-config`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Get the active payroll configuration
 */
export const getActivePayrollConfig = async () => {
    const response = await api.get('/active');
    return response.data;
};

/**
 * Get all payroll configurations
 */
export const getAllPayrollConfigs = async () => {
    const response = await api.get('/');
    return response.data;
};

/**
 * Create a new payroll configuration
 */
export const createPayrollConfig = async (data: any) => {
    const response = await api.post('/', data);
    return response.data;
};

/**
 * Update a payroll configuration
 */
export const updatePayrollConfig = async (id: string, data: any) => {
    const response = await api.put(`/${id}`, data);
    return response.data;
};

export const payrollConfigApi = {
    getActivePayrollConfig,
    getAllPayrollConfigs,
    createPayrollConfig,
    updatePayrollConfig,
};
