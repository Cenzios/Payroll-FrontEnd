import success from '../assets/images/success.svg';

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
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center transform transition-all scale-100">
                <div className="flex justify-center mb-4">
                    <div className="relative flex items-center justify-center p-3 rounded-full">

                        <img
                            src={success}
                            alt="Payroll Logo"
                            className="w-32 h-32 relative z-0"
                        />


                    </div>
                </div>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                    {title}
                </h3>

                <p className="text-gray-500 mb-6">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="w-44 bg-blue-600 text-white py-3 mb-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
