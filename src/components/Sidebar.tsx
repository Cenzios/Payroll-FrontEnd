import { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo-login.svg';

import {
    LayoutDashboard,
    Users,
    Wallet,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    Circle,
    CreditCard,
    Bell,
    MoreHorizontal,
    X
} from 'lucide-react';

import { useAppSelector } from '../store/hooks';
import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation
} from '../store/apiSlice';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import NotificationModal from './NotificationModal';
import Toast from './Toast';

const Sidebar = () => {
    const location = useLocation();
    const reportPaths = ['/reports', '/epf-etf', '/bank-advice', '/c-form'];
    const isReportActive = reportPaths.some(path => location.pathname === path);

    // ── Sidebar state ──
    const [isReportsOpen, setIsReportsOpen] = useState(isReportActive);
    const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
    const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

    // ── Notification state ──
    const { user } = useAppSelector((state) => state.auth);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const { data: dbNotifications = [] } = useGetNotificationsQuery(undefined, { skip: !user });
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();
    const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

    const uiNotifications: Notification[] = dbNotifications.map(n => ({
        id: n.id,
        type: n.type === 'ERROR' ? 'warning' : n.type.toLowerCase() as 'info' | 'warning',
        message: n.message,
        timestamp: new Date(n.createdAt).toLocaleDateString(),
        read: n.isRead
    }));

    const unreadCount = uiNotifications.filter(n => !n.read).length;

    const handleMarkAsRead = useCallback(async () => {
        const unreadIds = dbNotifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;
        for (const id of unreadIds) {
            await markAsRead(id);
        }
    }, [dbNotifications, markAsRead]);

    const handleNotificationBellClick = () => {
        const next = !isNotificationDropdownOpen;
        setIsNotificationDropdownOpen(next);
        if (next) handleMarkAsRead();
    };

    const handleNotificationClick = async (notification: Notification) => {
        setSelectedNotification(notification);
        setIsNotificationModalOpen(true);
        setIsNotificationDropdownOpen(false);
        if (!notification.read) {
            try {
                await markAsRead(notification.id).unwrap();
            } catch (err) {
                console.error('Failed to auto-mark notification as read:', err);
            }
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await deleteNotification(id).unwrap();
            setIsNotificationModalOpen(false);
            setSelectedNotification(null);
            setToast({ message: 'Notification deleted', type: 'success' });
        } catch {
            setToast({ message: 'Failed to delete notification', type: 'error' });
        }
    };

    const handleClearAll = async () => {
        try {
            await deleteAllNotifications().unwrap();
            setIsNotificationDropdownOpen(false);
            setToast({ message: 'All notifications cleared', type: 'success' });
        } catch {
            setToast({ message: 'Failed to clear notifications', type: 'error' });
        }
    };

    // ── Nav items ──
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        // { name: 'Notification', path: '/notification', icon: Bell },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Salary', path: '/salary', icon: Wallet },
        { name: 'Loans', path: '/loans', icon: CreditCard },
    ];

    const toggleReports = () => setIsReportsOpen(!isReportsOpen);

    const getItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[14px] font-semibold ${isActive
            ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white font-semibold'
            : 'text-[#67696C] hover:text-gray-700'
        }`;

    const getSubItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${isActive
            ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white font-semibold'
            : 'text-[#67696C] hover:font-bold'
        }`;

    const getMobileNavItemClass = (isActive: boolean) =>
        `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${isActive
            ? 'text-[#2054C8]'
            : 'text-[#67696C]'
        }`;

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <div className="w-64 bg-[#DCEAF7] h-full flex flex-col border-r border-white/10 fixed left-0 top-0 overflow-y-auto max-sm:hidden">
                {/* Logo */}
                <div className="p-6 flex items-center justify-center">
                    <NavLink to="/dashboard" className="cursor-pointer">
                        <img src={logo} alt="Payroll Logo" className="w-30 h-16 object-contain" />
                    </NavLink>
                </div>

                {/* Nav Items */}
                {/* TRIAL EXPIRE LOCK */}
                {/* <nav data-sidebar-nav className="flex-1 px-4 py-6 space-y-2"> */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => getItemClass(isActive)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}

                    {/* Reports Submenu */}
                    <div>
                        <button
                            onClick={toggleReports}
                            className={getItemClass(isReportActive)}
                            style={{ width: '100%', justifyContent: 'space-between' }}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span>Reports</span>
                            </div>
                            {isReportsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {isReportsOpen && (
                            <div className="mt-1 ml-4 space-y-1 pl-4 border-l-2 border-white/10">
                                <NavLink to="/reports" end className={({ isActive }) => getSubItemClass(isActive)}>
                                    <Circle className={`w-2 h-2 ${location.pathname === '/reports' ? 'fill-white' : ''}`} />
                                    <span>Payroll Summary</span>
                                </NavLink>
                                <NavLink to="/epf-etf" className={({ isActive }) => getSubItemClass(isActive)}>
                                    <Circle className={`w-2 h-2 ${location.pathname === '/epf-etf' ? 'fill-white' : ''}`} />
                                    <span>EPF / ETF</span>
                                </NavLink>
                                <NavLink to="/bank-advice" className={({ isActive }) => getSubItemClass(isActive)}>
                                    <Circle className={`w-2 h-2 ${location.pathname === '/bank-advice' ? 'fill-white' : ''}`} />
                                    <span>Bank Advice</span>
                                </NavLink>
                                <NavLink to="/c-form" className={({ isActive }) => getSubItemClass(isActive)}>
                                    <Circle className={`w-2 h-2 ${location.pathname === '/c-form' ? 'fill-white' : ''}`} />
                                    <span>C-Form</span>
                                </NavLink>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Settings */}
                {/* TRIAL EXPIRE LOCK */}
                {/* <div data-sidebar-nav className="p-4 border-t border-white/10"> */}

                <div className="p-4 border-t border-white/10">
                    <NavLink to="/settings" className={({ isActive }) => getItemClass(isActive)}>
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </div>

            {/* ── Mobile Bottom Navigation Bar ── */}
            <div className="sm:hidden fixed -bottom-14 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around px-2 py-1">

                    {/* Dashboard */}
                    <NavLink to="/dashboard" className={({ isActive }) => getMobileNavItemClass(isActive)}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#DCEAF7]' : ''}`}>
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#2054C8]' : 'text-[#67696C]'}`}>
                                    Dashboard
                                </span>
                            </>
                        )}
                    </NavLink>

                    {/* Notifications Bell */}
                    <div className="relative flex flex-col items-center">
                        <button
                            onClick={() => setIsNotificationDrawerOpen(true)}
                            className={getMobileNavItemClass(isNotificationDrawerOpen)}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isNotificationDrawerOpen ? 'bg-[#DCEAF7]' : ''}`}>
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                )}
                            </div>
                            <span className={`text-[10px] font-semibold ${isNotificationDrawerOpen ? 'text-[#2054C8]' : 'text-[#67696C]'}`}>
                                Notifications
                            </span>
                        </button>
                    </div>

                    {/* ── Mobile Notifications Drawer ── */}
                    {isNotificationDrawerOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                                onClick={() => setIsNotificationDrawerOpen(false)}
                            />
                            {/* Panel positioned just above the bottom nav bar */}
                            <div className="sm:hidden fixed bottom-[520px] left-2 right-2 z-50">
                                <NotificationDropdown
                                    isOpen={true}
                                    onClose={() => setIsNotificationDrawerOpen(false)}
                                    notifications={uiNotifications}
                                    onClearAll={handleClearAll}
                                    onNotificationClick={(notification) => {
                                        setIsNotificationDrawerOpen(false);
                                        handleNotificationClick(notification);
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {/* Employees */}
                    <NavLink to="/employees" className={({ isActive }) => getMobileNavItemClass(isActive)}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#DCEAF7]' : ''}`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#2054C8]' : 'text-[#67696C]'}`}>
                                    Employees
                                </span>
                            </>
                        )}
                    </NavLink>

                    {/* More */}
                    <button
                        onClick={() => setIsMobileMoreOpen(true)}
                        className={getMobileNavItemClass(isMobileMoreOpen)}
                    >
                        <div className={`p-1.5 rounded-xl transition-all duration-200 ${isMobileMoreOpen ? 'bg-[#DCEAF7]' : ''}`}>
                            <MoreHorizontal className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-semibold ${isMobileMoreOpen ? 'text-[#2054C8]' : 'text-[#67696C]'}`}>
                            More
                        </span>
                    </button>
                </div>

                {/* Safe area spacer */}
                <div style={{ height: 'env(safe-area-inset-bottom)' }} />
            </div>

            {/* ── Mobile "More" Drawer ── */}
            {isMobileMoreOpen && (
                <>
                    <div
                        className="sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsMobileMoreOpen(false)}
                    />
                    <div
                        className="sm:hidden fixed -bottom-14 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
                        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
                    >
                        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100">
                            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                            <span className="text-[15px] font-bold text-gray-800 mt-2">More Options</span>
                            <button
                                onClick={() => setIsMobileMoreOpen(false)}
                                className="p-1.5 rounded-full bg-gray-100 text-gray-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <nav className="px-4 py-3 space-y-1 -mb-20">
                            <NavLink
                                to="/salary"
                                onClick={() => setIsMobileMoreOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3.5 border-b border-gray-300 transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white'
                                        : 'text-[#67696C] hover:bg-gray-50'
                                    }`
                                }
                            >
                                <Wallet className="w-5 h-5" />
                                <span className="text-[14px] font-semibold">Salary</span>
                            </NavLink>

                            <NavLink
                                to="/loans"
                                onClick={() => setIsMobileMoreOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3.5 border-b border-gray-300 transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white'
                                        : 'text-[#67696C] hover:bg-gray-50'
                                    }`
                                }
                            >
                                <CreditCard className="w-5 h-5" />
                                <span className="text-[14px] font-semibold">Loans</span>
                            </NavLink>

                            {/* Reports expandable */}
                            <div>
                                <button
                                    onClick={toggleReports}
                                    className={`flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-300 transition-all duration-200 ${isReportActive
                                        ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white'
                                        : 'text-[#67696C] hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <FileText className="w-5 h-5" />
                                        <span className="text-[14px] font-semibold">Reports</span>
                                    </div>
                                    {isReportsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {isReportsOpen && (
                                    <div className="mt-1 ml-4 pl-4 space-y-1 border-b border-gray-300 ">
                                        {[
                                            { to: '/reports', label: 'Payroll Summary' },
                                            { to: '/epf-etf', label: 'EPF / ETF' },
                                            { to: '/bank-advice', label: 'Bank Advice' },
                                            { to: '/c-form', label: 'C-Form' },
                                        ].map(({ to, label }) => (
                                            <NavLink
                                                key={to}
                                                to={to}
                                                end={to === '/reports'}
                                                onClick={() => setIsMobileMoreOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${isActive
                                                        ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white font-semibold'
                                                        : 'text-[#67696C] hover:bg-gray-50'
                                                    }`
                                                }
                                            >
                                                <Circle className={`w-2 h-2 ${location.pathname === to ? 'fill-white' : ''}`} />
                                                <span>{label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <NavLink
                                to="/settings"
                                onClick={() => setIsMobileMoreOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-[#2054C8] to-[#5C5CB7] text-white'
                                        : 'text-[#67696C] hover:bg-gray-50'
                                    }`
                                }
                            >
                                <Settings className="w-5 h-5" />
                                <span className="text-[14px] font-semibold">Settings</span>
                            </NavLink>
                        </nav>
                    </div>
                </>
            )}

            {/* ── Notification Modal ── */}
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                notification={selectedNotification}
                onDelete={handleDeleteNotification}
            />

            {/* ── Toast ── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};

export default Sidebar;