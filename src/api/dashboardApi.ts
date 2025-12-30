import axiosInstance from './axios';

export const dashboardApi = {
    // Get dashboard summary
    getSummary: async (companyId?: string) => {
        try {
            const params = companyId ? { companyId } : {};
            const response = await axiosInstance.get('/dashboard/summary', { params });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
        }
    },
};
