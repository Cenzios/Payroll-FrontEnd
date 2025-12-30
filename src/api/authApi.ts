import axiosInstance from './axios';

export const updateProfile = async (data: { fullName: string }) => {
    const response = await axiosInstance.put('/auth/profile', data);
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await axiosInstance.post('/auth/change-password', data);
    return response.data;
};
