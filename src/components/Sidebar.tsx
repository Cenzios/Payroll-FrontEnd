import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Wallet,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    Circle
} from 'lucide-react';

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
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                        <span className="text-blue-600">P</span>
                        <span className="text-gray-800">ayroll</span>
                    </div>
                </div>
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
                            {/* Future reports can go here */}
                        </div>
                    )}
                </div>

            </nav>

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
