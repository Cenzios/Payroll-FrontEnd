import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  apiSlice,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation
} from '../store/apiSlice';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import NotificationModal from './NotificationModal';
import Toast from './Toast';

interface HeaderActionsProps {
  showLogout?: boolean;
}

const HeaderActions = ({ showLogout = true }: HeaderActionsProps = {}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: dbNotifications = [] } = useGetNotificationsQuery(undefined, { skip: !user });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  const uiNotifications: Notification[] = dbNotifications.map(n => ({
    id: n.id,
    type: n.type === 'ERROR' ? 'warning' : n.type.toLowerCase() as 'info' | 'warning',
    message: n.message,
    timestamp: new Date(n.createdAt).toLocaleDateString(),
    read: n.isRead
  }));

  const unreadCount = uiNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = useCallback(async () => {
    const unreadIds = dbNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await markAsRead(id);
    }
  }, [dbNotifications, markAsRead]);

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      setIsNotificationModalOpen(false);
      setSelectedNotification(null);
      setToast({ message: 'Notification deleted', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to delete notification', type: 'error' });
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications().unwrap();
      setIsNotificationDropdownOpen(false);
      setToast({ message: 'All notifications cleared', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to clear notifications', type: 'error' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              const nextState = !isNotificationDropdownOpen;
              setIsNotificationDropdownOpen(nextState);
              if (nextState) {
                handleMarkAsRead();
              }
            }}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center relative transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          <NotificationDropdown
            isOpen={isNotificationDropdownOpen}
            onClose={() => setIsNotificationDropdownOpen(false)}
            notifications={uiNotifications}
            onClearAll={handleClearAll}
            onNotificationClick={async (notification) => {
              setSelectedNotification(notification);
              setIsNotificationModalOpen(true);
              setIsNotificationDropdownOpen(false);
              if (!notification.read) {
                try {
                  await markAsRead(notification.id).unwrap();
                } catch (err) {
                  console.error("Failed to auto-mark notification as read:", err);
                }
              }
            }}
          />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
            <div className="text-xs text-gray-500">{user?.role || 'Admin'}</div>
          </div>
        </div>

        {/* Logout */}
        {showLogout && (
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notification={selectedNotification}
        onDelete={handleDeleteNotification}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default HeaderActions;
