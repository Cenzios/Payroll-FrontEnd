import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Phone, Mail, MapPin, Calendar, DollarSign, User, Briefcase, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import UniversalDrawer from '../components/UniversalDrawer';
import SuccessModal from '../components/SuccessModal';
import { useAppSelector } from '../store/hooks';
import { employeeApi } from '../api/employeeApi';
import { Employee } from '../types/employee.types';
import Toast from '../components/Toast';

const Employees = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch Employees
    const fetchEmployees = async () => {
        if (!selectedCompanyId) return;
        try {
            setIsLoading(true);
            const data = await employeeApi.getEmployees(selectedCompanyId, 1, 100, search); // Fetch all for now or pagination later
            setEmployees(data.employees);

            // Should we auto-select the first one?
            // if (data.employees.length > 0 && !selectedEmployee) {
            //     setSelectedEmployee(data.employees[0]);
            // }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [selectedCompanyId, search]);

    const handleAddEmployee = async (data: any) => {
        try {
            await employeeApi.createEmployee(data);
            setIsDrawerOpen(false);
            setModalMessage('The employee has been successfully saved.');
            setShowSuccessModal(true);
            fetchEmployees();
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to add employee', type: 'error' });
            throw error; // Re-throw to keep drawer open or handle error in drawer? Drawer catches it.
        }
    };

    // Derived state for filtered list if client-side search preferred, but we use backend search
    // const filteredEmployees = employees; 

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-64 p-8 h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                        <p className="text-sm text-gray-500 mt-1">Here's your Employees overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (!selectedCompanyId) {
                                    setToast({ message: 'Please select a company from the Dashboard first.', type: 'error' });
                                    return;
                                }
                                setIsDrawerOpen(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <span className="hidden sm:inline">Add Employee</span>
                            <Plus className="w-5 h-5" />
                        </button>
                        {/* Notification and Profile icons can go here matching dashboard */}
                    </div>
                </header>

                {/* Main Content - Two Column Layout */}
                {!selectedCompanyId ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h3>
                            <p className="text-gray-500">Please go to the Dashboard and select a company to view employees.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-6 flex-1 overflow-hidden">
                        {/* Left Column - Employee List */}
                        <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            {/* Search */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search users by name"
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                    </div>
                                ) : employees.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No employees found.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {employees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                onClick={() => setSelectedEmployee(emp)}
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 ${selectedEmployee?.id === emp.id ? 'bg-blue-50/60' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                        <span className="text-blue-600 font-semibold text-sm">
                                                            {emp.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">{emp.fullName}</h4>
                                                        <p className="text-xs text-gray-500 truncate">{emp.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{emp.contactNumber}</span>
                                                    </div>
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Employee Details */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto">
                            {selectedEmployee ? (
                                <div className="p-8">
                                    {/* Profile Header */}
                                    <div className="flex items-start gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                                            {selectedEmployee.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.fullName}</h2>
                                            <p className="text-gray-500 text-sm mt-1">{selectedEmployee.employeeId}</p>
                                            <div className="flex gap-2 mt-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                    {selectedEmployee.designation}
                                                </span>
                                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 gap-6 max-w-2xl">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase">Full Name</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedEmployee.fullName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase">Email Address</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedEmployee.email || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedEmployee.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase">Phone Number</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedEmployee.contactNumber}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Joining Date</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {new Date(selectedEmployee.joinedDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Daily Rate</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {selectedEmployee.dailyRate.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>Select an employee to view details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Employee Drawer */}
            <UniversalDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleAddEmployee}
                mode="employee"
                companyId={selectedCompanyId || undefined}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Employee Added"
                message={modalMessage}
            />

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Employees;
