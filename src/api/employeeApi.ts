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
    getEmployees: async (companyId: string, page = 1, limit = 10, search = ''): Promise<{ employees: Employee[], total: number, totalPages: number }> => {
        try {
            const response = await axiosInstance.get(`/employee`, {
                params: {
                    companyId,
                    page,
                    limit,
                    search
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
                data: { companyId } // Pass companyId in body if required by backend check, or query? 
                // Backend deleteEmployee checks: const company = await prisma.company.findFirst({ where: { id: companyId, ownerId: userId } });
                // But usually DELETE requests don't have body in some clients/servers? 
                // Actually my backend controller: const { companyId } = req.body; check employee.controller.ts
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
