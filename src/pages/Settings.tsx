import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AccountTab from '../components/settings/AccountTab';
import PaymentTab from '../components/settings/PaymentTab';

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'account' | 'payment'>('account');

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-8 py-4">
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
                    </div>
                </header>
                <main className="p-8">
                    <div className="max-w-4xl">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-200 mb-8">
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'account'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Account
                            </button>
                            <button
                                onClick={() => setActiveTab('payment')}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'payment'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Payment Details
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {activeTab === 'account' ? <AccountTab /> : <PaymentTab />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
