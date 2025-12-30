import { useState } from 'react';
import { X, CreditCard, Calendar, Lock, Loader2 } from 'lucide-react';

interface AddCardDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (card: any) => void;
}

const AddCardDrawer = ({ isOpen, onClose, onSubmit }: AddCardDrawerProps) => {
    const [formData, setFormData] = useState({
        number: '',
        expiry: '',
        cvv: '',
        brand: 'visa'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            onSubmit({
                brand: formData.brand,
                last4: formData.number.slice(-4),
                expiry: formData.expiry
            });
            setIsSubmitting(false);
            setFormData({ number: '', expiry: '', cvv: '', brand: 'visa' });
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] animate-in slide-in-from-right duration-300">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Add New Card</h2>
                            <p className="text-sm text-gray-500 mt-1">Securely add your payment method</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Card Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <CreditCard className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value.replace(/\s/g, '').slice(0, 16) })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Expiry */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Calendar className="h-5 w-5" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={formData.expiry}
                                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value.slice(0, 5) })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                {/* CVV */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Lock className="h-5 w-5" />
                                        </span>
                                        <input
                                            type="password"
                                            placeholder="123"
                                            value={formData.cvv}
                                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value.slice(0, 3) })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Brand Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Card Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, brand: 'visa' })}
                                        className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${formData.brand === 'visa' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <img src="/src/assets/images/visa.svg" alt="Visa" className="h-6" />
                                        <span className={`text-xs font-semibold ${formData.brand === 'visa' ? 'text-blue-600' : 'text-gray-400'}`}>Visa</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, brand: 'mastercard' })}
                                        className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${formData.brand === 'mastercard' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <img src="/src/assets/images/mastercard.svg" alt="Mastercard" className="h-6" />
                                        <span className={`text-xs font-semibold ${formData.brand === 'mastercard' ? 'text-blue-600' : 'text-gray-400'}`}>Mastercard</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-700 text-sm mb-6">
                                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                                <p>Your payment information is handled locally and is not sent to our servers during this demonstration.</p>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm and Save'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default AddCardDrawer;
