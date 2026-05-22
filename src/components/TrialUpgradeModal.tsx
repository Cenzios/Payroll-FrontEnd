import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

const TrialUpgradeModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpenModal = () => setIsOpen(true);
        window.addEventListener('open-trial-upgrade-modal', handleOpenModal);

        return () => window.removeEventListener('open-trial-upgrade-modal', handleOpenModal);
    }, []);

    const handleStartUpgrade = () => {
        setIsLoading(true);
        // Briefly show loader then navigate
        setTimeout(() => {
            setIsOpen(false);
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('trial-modal-closed'));
            navigate('/buy-plan?isUpgrade=true');
        }, 500);
    };

    const handleClose = () => {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('trial-modal-closed'));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        Trial Period Ended
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <AlertCircle className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Your trial has expired!
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Your trial period has ended. Please upgrade your plan to unlock full access and continue using all features.
                        </p>
                        <button
                            onClick={handleStartUpgrade}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Upgrade Plan Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialUpgradeModal;
