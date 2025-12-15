import axiosInstance from './axios';
import { CreateEmployeeRequest, Employee } from '../types/employee.types';

export const employeeApi = {
    // Create new employee
    createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
        try {
            const response = await axiosInstance.post('/employee', data);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create employee');
        }
    },
};
