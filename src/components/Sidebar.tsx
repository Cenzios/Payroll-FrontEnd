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
    const reportPaths = ['/reports', '/epf-etf', '/bank-advice', '/c-form'];
    const isReportActive = reportPaths.some(path => location.pathname === path);

    const [isReportsOpen, setIsReportsOpen] = useState(isReportActive);

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

    const getItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[14px] font-semibold ${isActive
            ? 'bg-white/10 backdrop-blur-md text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`;

    const getSubItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${isActive
            ? 'bg-white/10 text-white font-semibold'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`;

    return (
        <div className="w-64 bg-[#000827] h-screen flex flex-col border-r border-white/10 fixed left-0 top-0 overflow-y-auto">
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
                            <NavLink
                                to="/reports"
                                end
                                className={({ isActive }) => getSubItemClass(isActive)}
                            >
                                <Circle className={`w-2 h-2 ${location.pathname === '/reports' ? 'fill-white' : ''}`} />
                                <span>Payroll summary</span>
                            </NavLink>
                            <NavLink
                                to="/epf-etf"
                                className={({ isActive }) => getSubItemClass(isActive)}
                            >
                                <Circle className={`w-2 h-2 ${location.pathname === '/epf-etf' ? 'fill-white' : ''}`} />
                                <span>EPF / ETF</span>
                            </NavLink>
                            <NavLink
                                to="/bank-advice"
                                className={({ isActive }) => getSubItemClass(isActive)}
                            >
                                <Circle className={`w-2 h-2 ${location.pathname === '/bank-advice' ? 'fill-white' : ''}`} />
                                <span>Bank Advice</span>
                            </NavLink>
                            <NavLink
                                to="/c-form"
                                className={({ isActive }) => getSubItemClass(isActive)}
                            >
                                <Circle className={`w-2 h-2 ${location.pathname === '/c-form' ? 'fill-white' : ''}`} />
                                <span>C-Form </span>
                            </NavLink>
                        </div>
                    )}
                </div>

            </nav>

            {/* Settings at Bottom */}
            <div className="p-4 border-t border-white/10">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => getItemClass(isActive)}
                >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
