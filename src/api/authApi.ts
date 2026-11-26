import axios from 'axios';
import axiosInstance from './axios';
import type { User } from '../types/auth.types';

interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

/** The API's own `message` for a failed request (service layer), else the fallback. */
export const apiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }
    return error instanceof Error && error.message ? error.message : fallback;
};

export const updateProfile = async (data: { fullName: string }): Promise<ApiEnvelope<Partial<User> | null>> => {
    const response = await axiosInstance.put<ApiEnvelope<Partial<User> | null>>('/auth/profile', data);
    return response.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<ApiEnvelope<null>> => {
    const response = await axiosInstance.post<ApiEnvelope<null>>('/auth/change-password', data);
    return response.data;
};
