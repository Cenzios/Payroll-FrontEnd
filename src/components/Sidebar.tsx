import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.svg';
// import dashboard from '../assets/images/navbar-dashboard.svg';
// import salary from '../assets/images/navbar-salary.svg';
// import loan from '../assets/images/navbar-loan.svg';

import {
    LayoutDashboard,
    Users,
    Wallet,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    Circle,
    CreditCard
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const [isReportsOpen, setIsReportsOpen] = useState(
        location.pathname.startsWith('/reports') || location.pathname === '/c-form'
    );

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Salary', path: '/salary', icon: Wallet },
        { name: 'Loans', path: '/loans', icon: CreditCard },
    ];

    // const navItems = [
    //     { name: 'Dashboard', path: '/dashboard', img: dashboard },
    //     { name: 'Employees', path: '/employees', icon: Users },
    //     { name: 'Salary', path: '/salary', img: salary },
    //     { name: 'Loans', path: '/loans', img: loan },
    // ];

    const toggleReports = () => {
        setIsReportsOpen(!isReportsOpen);
    };

    return (
        <div className="w-64 bg-[#000827] h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 overflow-y-auto">
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-center">
                <NavLink to="/dashboard" className="cursor-pointer">
                    <img
                        src={logo}
                        alt="Payroll Logo"
                        className="w-30 h-16 object-contain"
                    />
                </NavLink>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[14px] font-semibold ${isActive
                                ? 'bg-white/10 backdrop-blur-md text-white '
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />

                        {/* {item.icon ? (
                            <item.icon className="w-5 h-5" />
                        ) : (
                            <img
                                src={item.img}
                                alt={item.name}
                                className={`w-5 h-5 object-contain 
                                    ${location.pathname === item.path
                                        ? "text-blue-700"
                                        : "opacity-60"
                                    }`}
                            />)} */}

                        <span>{item.name}</span>
                    </NavLink>
                ))}

                {/* Reports Submenu */}
                <div>
                    <button
                        onClick={toggleReports}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-[14px] font-semibold ${(location.pathname.startsWith('/reports') || location.pathname === '/c-form')
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
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
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${isActive
                                        ? 'text-blue-600 font-medium'
                                        : 'text-[#67696C] hover:text-gray-900'
                                    }`
                                }
                            >
                                <Circle className="w-2 h-2" />
                                <span>Salary Report</span>
                            </NavLink>
                            <NavLink
                                to="/c-form"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${isActive
                                        ? 'text-blue-600 font-medium'
                                        : 'text-[#67696C] hover:text-gray-900'
                                    }`
                                }
                            >
                                <Circle className="w-2 h-2" />
                                <span>C-Form</span>
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
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[14px] ${isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
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
