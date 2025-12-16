import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const SuccessModal = ({ isOpen, onClose, title, message }: SuccessModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {title}
                </h3>

                <p className="text-gray-500 mb-6">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
