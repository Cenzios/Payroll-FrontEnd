export type NotificationType = 'INFO' | 'WARNING' | 'ERROR';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    isDeleted: boolean;
    createdAt: string;
}

export interface GetNotificationsResponse {
    notifications: Notification[];
}

export interface UnreadCountResponse {
    count: number;
}
