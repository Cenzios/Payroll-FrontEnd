import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import AccountTab from '../components/settings/AccountTab';
import SubscriptionSection from '../components/settings/SubscriptionSection';
import AlertBar from '../components/AlertBar';
import logo from '../assets/images/logo-login.svg';
import { useAppSelector } from '../store/hooks';

const Settings = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState<'account' | 'payment'>('account');

    const tabs = [
        { key: 'account' as const, label: 'Account' },
        { key: 'payment' as const, label: 'Payment Details' },
    ];

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
            <AlertBar />

            {/* Margin bottom gap after the banner */}
            <div className="-mb-4 shrink-0"></div>

            <div className="flex flex-1 overflow-hidden relative w-full translate-x-0 md:translate-x-0">
                <Sidebar />

                <div className="flex-1 ml-0 md:ml-64 md:p-6 h-screen overflow-hidden flex flex-col">

                    {/* MOBILE HEADER */}
                    <div className="hidden mt-6 max-sm:flex items-center justify-between pt-5 pb-3 border-b border-gray-100">
                        <div>
                            <img src={logo} alt="logo" className='w-40 h-10' />
                        </div>
                        <div className="flex items-center gap-2 ml-6">

                            {/* Avatar circle */}
                            <div className="w-9 h-9 rounded-full mr-5 bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Title & Action */}
                    <div className="hidden max-sm:block px-6 py-4 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className='px-3'>
                                <div className="inline-block rounded-sm">
                                    <h1 className="text-[22px] font-bold text-[#1D1F24]">Settings</h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="shrink-0">
                        <div className="max-sm:hidden">
                            <PageHeader
                                title="Settings"
                                subtitle=""
                            />
                        </div>
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-gray-200 mb-4 max-sm:px-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-3 text-[14px] font-medium transition-all border-b-2 ${activeTab === tab.key
                                        ? 'text-gray-900 border-blue-600'
                                        : 'text-gray-400 border-transparent hover:text-gray-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-sm:px-6 max-sm:pb-16">
                        <div className="max-w-5xl animate-in fade-in duration-500">
                            {activeTab === 'account' && <AccountTab />}
                            {activeTab === 'payment' && <SubscriptionSection />}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
