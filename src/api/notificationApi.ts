import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/notifications`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Get user's notifications
 * @param includeRead - Include read notifications (default: true)
 */
export const getUserNotifications = async (includeRead: boolean = true) => {
    const response = await api.get(`/?includeRead=${includeRead}`);
    return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
    const response = await api.get('/unread-count');
    return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (id: string) => {
    const response = await api.put(`/${id}/read`);
    return response.data;
};

/**
 * Delete a notification (soft delete)
 */
export const deleteNotification = async (id: string) => {
    const response = await api.delete(`/${id}`);
    return response.data;
};

export const notificationApi = {
    getUserNotifications,
    getUnreadCount,
    markNotificationAsRead,
    deleteNotification,
};
