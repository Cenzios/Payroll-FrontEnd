import { useRef, useEffect } from 'react';
import { X, Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'alert';
    message: string;
    timestamp: string;
    read: boolean;
}

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: () => void;
}

const NotificationDropdown = ({ isOpen, onClose, notifications, onMarkAsRead }: NotificationDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            onMarkAsRead();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, onMarkAsRead]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm">No new notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                                        notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'}`}
                                >
                                    {notification.type === 'alert' ? <AlertCircle className="w-4 h-4" /> :
                                        notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                            <Info className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 leading-snug mb-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {notification.timestamp}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="mt-2 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
