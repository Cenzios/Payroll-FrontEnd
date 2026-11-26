import axiosInstance from './axios';

// All calls go through the shared instance (in-memory Bearer + refresh-on-401).
const BASE_PATH = '/payroll-config';

/**
 * Get the active payroll configuration
 */
export const getActivePayrollConfig = async () => {
    const response = await axiosInstance.get(`${BASE_PATH}/active`);
    return response.data;
};

/**
 * Get all payroll configurations
 */
export const getAllPayrollConfigs = async () => {
    const response = await axiosInstance.get(`${BASE_PATH}/`);
    return response.data;
};

/**
 * Create a new payroll configuration
 */
export const createPayrollConfig = async (data: any) => {
    const response = await axiosInstance.post(`${BASE_PATH}/`, data);
    return response.data;
};

/**
 * Update a payroll configuration
 */
export const updatePayrollConfig = async (id: string, data: any) => {
    const response = await axiosInstance.put(`${BASE_PATH}/${id}`, data);
    return response.data;
};

export const payrollConfigApi = {
    getActivePayrollConfig,
    getAllPayrollConfigs,
    createPayrollConfig,
    updatePayrollConfig,
};
