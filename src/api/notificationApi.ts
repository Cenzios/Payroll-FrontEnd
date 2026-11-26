import axiosInstance from './axios';

// All calls go through the shared instance (in-memory Bearer + refresh-on-401).
const BASE_PATH = '/notifications';

/**
 * Get user's notifications
 * @param includeRead - Include read notifications (default: true)
 */
export const getUserNotifications = async (includeRead: boolean = true) => {
    const response = await axiosInstance.get(`${BASE_PATH}/?includeRead=${includeRead}`);
    return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
    const response = await axiosInstance.get(`${BASE_PATH}/unread-count`);
    return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (id: string) => {
    const response = await axiosInstance.put(`${BASE_PATH}/${id}/read`);
    return response.data;
};

/**
 * Delete a notification (soft delete)
 */
export const deleteNotification = async (id: string) => {
    const response = await axiosInstance.delete(`${BASE_PATH}/${id}`);
    return response.data;
};

export const notificationApi = {
    getUserNotifications,
    getUnreadCount,
    markNotificationAsRead,
    deleteNotification,
};
