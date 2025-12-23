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

    // Get employees with pagination and search
    getEmployees: async (companyId: string, page = 1, limit = 10, search = '', status?: string): Promise<{ employees: Employee[], total: number, totalPages: number }> => {
        try {
            const response = await axiosInstance.get(`/employee`, {
                params: {
                    companyId,
                    page,
                    limit,
                    search,
                    status // ✅ Pass status filter
                }
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch employees');
        }
    },

    // Delete employee
    deleteEmployee: async (companyId: string, employeeId: string): Promise<void> => {
        try {
            await axiosInstance.delete(`/employee/${employeeId}`, {
                params: { companyId }
            });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete employee');
        }
    },

    // Update employee
    updateEmployee: async (companyId: string, employeeId: string, data: Partial<CreateEmployeeRequest>): Promise<Employee> => {
        try {
            const response = await axiosInstance.put(`/employee/${employeeId}`, {
                ...data,
                companyId
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update employee');
        }
    }
};
