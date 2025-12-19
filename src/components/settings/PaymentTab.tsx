import { useState } from 'react';
import { CreditCard, Plus, Trash2, ShieldCheck, Crown, ExternalLink, RefreshCcw, Calendar, Users, DollarSign } from 'lucide-react';
import AddCardDrawer from './AddCardDrawer';

// Dummy static paths based on project assets
const VISA_ICON = '/src/assets/images/visa.svg';
const MASTERCARD_ICON = '/src/assets/images/mastercard.svg';

interface Card {
    id: string;
    brand: 'visa' | 'mastercard';
    last4: string;
    expiry: string;
    isDefault: boolean;
}

const PaymentTab = () => {
    const [cards, setCards] = useState<Card[]>([
        { id: '1', brand: 'mastercard', last4: '1075', expiry: '02/28', isDefault: true },
        { id: '2', brand: 'visa', last4: '1075', expiry: '02/28', isDefault: false }
    ]);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    const handleSetDefault = (id: string) => {
        setCards(cards.map(card => ({
            ...card,
            isDefault: card.id === id
        })));
    };

    const handleDeleteCard = (id: string) => {
        setCards(cards.filter(card => card.id !== id));
    };

    const handleAddCard = (newCard: any) => {
        setCards([...cards, { ...newCard, id: Date.now().toString(), isDefault: cards.length === 0 }]);
        setIsAddCardOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Credit Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Credit Card
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">Manage your credit card or payment option here.</p>
                    <button
                        onClick={() => setIsAddCardOpen(true)}
                        className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
                    >
                        <Plus className="h-4 w-4" /> Add New Card
                    </button>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${card.isDefault ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-10 flex items-center justify-center p-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                                    <img
                                        src={card.brand === 'visa' ? VISA_ICON : MASTERCARD_ICON}
                                        alt={card.brand}
                                        className="h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900 tracking-widest flex items-center gap-2">
                                        •••• •••• •••• {card.last4}
                                        {card.isDefault && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-normal font-bold px-1.5 py-0.5 rounded">Default</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Exp. date {card.expiry}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!card.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(card.id)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-white transition-all border border-transparent hover:border-blue-100"
                                    >
                                        Set as default
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            {/* Mobile View / Always Visible Action if not hovered */}
                            <div className="lg:hidden">
                                <ShieldCheck className={`h-5 w-5 ${card.isDefault ? 'text-blue-500' : 'text-gray-300'}`} />
                            </div>
                        </div>
                    ))}
                    {cards.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                            <p className="text-gray-400 text-sm">No payment methods added</p>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Subscription Plan Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-blue-600" />
                        Subscription Plan
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">Manage your subscription plan here.</p>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-700">
                            <Crown className="h-24 w-24 text-blue-600" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
                                            <ShieldCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                                Payrole
                                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Basic</span>
                                            </h4>
                                            <div className="flex items-center gap-2 text-blue-600 font-medium mt-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="text-xl">100</span>
                                                <span className="text-sm text-gray-400 font-normal">/per employee</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Total Employees</div>
                                            <div className="text-sm font-semibold text-gray-900">10 Employees</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Next Billing</div>
                                            <div className="text-sm font-semibold text-gray-900">26/11/2026</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all order-2 sm:order-1 capitalize">
                                    Cancel plan
                                </button>
                                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 shadow-lg shadow-blue-100">
                                    Change Plan <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <RefreshCcw className="h-3 w-3" /> Auto-renewal is enabled for this subscription
                    </div>
                </div>
            </div>

            <AddCardDrawer
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
                onSubmit={handleAddCard}
            />
        </div>
    );
};

export default PaymentTab;
