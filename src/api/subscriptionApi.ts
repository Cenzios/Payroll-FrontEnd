import axiosInstance from './axios';

export const subscriptionApi = {
    purchaseAddon: async (type: string, value: number) => {
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
