import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = type === 'success' ? CheckCircle : XCircle;
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div
            className={`fixed top-4 right-4 ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slideIn z-50`}
            style={{
                animation: 'slideIn 0.3s ease-out',
            }}
        >
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
            <p className={`${textColor} flex-1 font-medium`}>{message}</p>
            <button
                onClick={onClose}
                className={`${textColor} hover:opacity-70 transition-opacity`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
