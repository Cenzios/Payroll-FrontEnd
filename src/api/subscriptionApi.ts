import axiosInstance from './axios';

export const subscriptionApi = {
    /** Adds employee slots (raise the per-company limit; billing stays per active employee). 422 if invalid. */
    purchaseAddon: async (type: 'EMPLOYEE_EXTRA', value: number) => {
        try {
            const response = await axiosInstance.post('/subscription/addon', {
                type,
                value
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to purchase add-on');
        }
    }
};
