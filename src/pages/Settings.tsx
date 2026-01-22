import Sidebar from '../components/Sidebar';
import AccountTab from '../components/settings/AccountTab';
import SubscriptionSection from '../components/settings/SubscriptionSection';

const Settings = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-8 py-4">
                        <h1 className="text-[28px] font-medium text-gray-900 leading-tight">Settings</h1>
                        <p className="text-[16px] font-normal text-gray-500 mt-1 leading-[1.7]">Manage your account and subscription</p>
                    </div>
                </header>
                <main className="p-8">
                    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
                        <AccountTab />
                        <hr className="border-gray-200" />
                        <SubscriptionSection />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
