import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

const RenewPlanModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpenModal = () => setIsOpen(true);
        window.addEventListener('open-renew-modal', handleOpenModal);

        return () => window.removeEventListener('open-renew-modal', handleOpenModal);
    }, []);

    const handleStartRenewal = () => {
        setIsLoading(true);
        // Briefly show loader then navigate
        setTimeout(() => {
            setIsOpen(false);
            setIsLoading(false);
            navigate('/settle-invoice');
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        Subscription Expired
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="w-10 h-10 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Your plan has expired!
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Please settle your outstanding invoices to continue accessing all features and data.
                        </p>
                        <button
                            onClick={handleStartRenewal}
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-red-200"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Renew Plan Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RenewPlanModal;
