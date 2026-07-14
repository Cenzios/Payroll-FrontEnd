import { useState, memo } from 'react';
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
    Sparkles
} from 'lucide-react';

// Memoized Upgrade Now Component to prevent re-renders
const UpgradeNow = memo(() => {
    return (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Upgrade Now</p>
                    <p className="text-xs text-white/80">Get more features</p>
                </div>
                <button className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                    Upgrade
                </button>
            </div>
        </div>
    );
});

UpgradeNow.displayName = 'UpgradeNow';

const Sidebar = () => {
    const location = useLocation();
    const [isReportsOpen, setIsReportsOpen] = useState(location.pathname.startsWith('/reports'));

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Salary', path: '/salary', icon: Wallet },
    ];

    const toggleReports = () => {
        setIsReportsOpen(!isReportsOpen);
    };

    return (
        <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 overflow-y-auto">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-200">
                <NavLink to="/dashboard">
                    <img src={logo} alt="Payroll Logo" className="w-30 h-16 object-contain" />
                </NavLink>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}

                {/* Reports Submenu */}
                <div>
                    <button
                        onClick={toggleReports}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname.startsWith('/reports')
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" />
                            <span>Reports</span>
                        </div>
                        {isReportsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {isReportsOpen && (
                        <div className="mt-1 ml-4 space-y-1 pl-4 border-l-2 border-gray-100">
                            <NavLink
                                to="/reports"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive
                                        ? 'text-blue-600 font-medium'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`
                                }
                            >
                                <Circle className="w-2 h-2" />
                                <span>Salary Report</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            </nav>

            {/* Upgrade Now Component - Rendered outside nav, won't re-render on navigation */}
            <div className="mt-auto">
                <UpgradeNow />
            </div>

            {/* Settings at Bottom */}
            <div className="p-4 border-t border-gray-200">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;