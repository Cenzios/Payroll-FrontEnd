import { Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from './NotificationDropdown';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
    onDelete: (id: string) => void;
}

const NotificationModal = ({ isOpen, onClose, notification, onDelete }: NotificationModalProps) => {
    if (!isOpen || !notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'alert':
                return <AlertCircle className="size-6" />;
            case 'warning':
                return <AlertTriangle className="size-6" />;
            default:
                return <Info className="size-6" />;
        }
    };

    const getIconBg = () => {
        switch (notification.type) {
            case 'alert':
                return 'bg-red-500/10';
            case 'warning':
                return 'bg-orange-500/10';
            default:
                return 'bg-blue-500/10';
        }
    };

    const getTitle = () => {
        switch (notification.type) {
            case 'alert':
                return 'Urgent Alert';
            case 'warning':
                return 'Warning';
            default:
                return 'Notification Details';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-xl ${getIconBg()} sm:mx-0 sm:size-10 shadow-sm border border-black/5`}>
                                <div className={`
                    ${notification.type === 'alert' ? 'text-red-600' :
                                        notification.type === 'warning' ? 'text-orange-600' : 'text-blue-600'}
                `}>
                                    {getIcon()}
                                </div>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg font-bold text-gray-900 leading-6">
                                    {getTitle()}
                                </h3>
                                <div className="mt-2 text-sm text-gray-500 font-medium">
                                    {notification.timestamp}
                                </div>
                                <div className="mt-4">
                                    <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => onDelete(notification.id)}
                            className="inline-flex w-full justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all sm:ml-3 sm:w-auto"
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all sm:mt-0 sm:w-auto"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
