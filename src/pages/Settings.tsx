import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import AccountTab from '../components/settings/AccountTab';
import SubscriptionSection from '../components/settings/SubscriptionSection';

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'account' | 'payment'>('account');

    const tabs = [
        { key: 'account' as const, label: 'Account' },
        { key: 'payment' as const, label: 'Payment Details' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 flex flex-col h-screen overflow-hidden">
                <div className="shrink-0">
                    <PageHeader title="Settings" subtitle="" />
                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-gray-200 mb-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-3 text-[14px] font-medium transition-all border-b-2 ${
                                    activeTab === tab.key
                                        ? 'text-gray-900 border-blue-600'
                                        : 'text-gray-400 border-transparent hover:text-gray-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="max-w-5xl animate-in fade-in duration-500">
                        {activeTab === 'account' && <AccountTab />}
                        {activeTab === 'payment' && <SubscriptionSection />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
