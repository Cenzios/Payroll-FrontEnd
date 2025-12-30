import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmationModalProps) => {
    if (!isOpen) return null;

    const isDanger = type === 'danger';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${isDanger ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        <AlertTriangle className={`w-8 h-8 ${isDanger ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {title}
                </h3>

                <p className="text-gray-500 mb-6">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition-colors ${isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
