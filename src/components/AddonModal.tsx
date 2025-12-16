import { useState } from 'react';
import { Minus, Plus, CreditCard, Loader2 } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

interface AddonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onUpgradePlan: () => void; // For the bottom CTA
}

const AddonModal = ({ isOpen, onClose, onSuccess, onUpgradePlan }: AddonModalProps) => {
    const [slots, setSlots] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const PRICE_PER_SLOT = 150;

    const handleIncrement = () => setSlots(prev => prev + 1);
    const handleDecrement = () => setSlots(prev => (prev > 1 ? prev - 1 : 1));

    const handlePurchase = async () => {
        setIsProcessing(true);
        setError('');
        try {
            await subscriptionApi.purchaseAddon('EMPLOYEE_EXTRA', slots);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Purchase failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Mini-Bundle Add-Ons</h2>
                    <p className="text-sm text-gray-500 mt-1">Need more capacity? Choose a bundle</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Slot Selector */}
                    <div className="flex flex-col items-center mb-8">
                        <label className="text-sm font-medium text-gray-700 mb-4">Number of Additional Slots</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDecrement}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                                disabled={slots <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <div className="w-20 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-lg font-bold text-gray-900">
                                {slots}
                            </div>

                            <button
                                onClick={handleIncrement}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Slider Visualization (Simple bar) */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(slots * 5, 100)}%` }} // Just a visual filler
                        />
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price per slot</span>
                            <span className="font-medium text-green-600">Rs. {PRICE_PER_SLOT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Number of additional slots</span>
                            <span className="font-medium text-blue-600">{slots}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-xl text-blue-600">Rs. {(PRICE_PER_SLOT * slots).toFixed(2)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 space-y-4">
                    <div className="flex gap-4">
                        <button
                            onClick={handlePurchase}
                            disabled={isProcessing}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CreditCard className="w-4 h-4" />
                            )}
                            Confirm Purchase
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Enterprise CTA */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-xl">
                            <div>
                                <p className="text-xs font-semibold text-gray-200">Need even more capacity?</p>
                                <p className="text-[10px] text-gray-400">Upgrade to Enterprise plan for unlimited employees</p>
                            </div>
                            <button
                                onClick={onUpgradePlan}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-700"
                            >
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddonModal;
