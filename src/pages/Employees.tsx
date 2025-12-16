import { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, Phone, Mail, MapPin, Calendar, DollarSign, User, Briefcase, Loader2, Edit, Trash2, Ban } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import UniversalDrawer from '../components/UniversalDrawer';
import SuccessModal from '../components/SuccessModal';
import ConfirmationModal from '../components/ConfirmationModal'; // Import ConfirmationModal
import AddonModal from '../components/AddonModal'; // Import AddonModal
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
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

    // Kebab Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'danger' | 'warning' | 'info';
        title: string;
        message: string;
        confirmText?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'danger',
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Edit State
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Fetch Employees
    const fetchEmployees = async () => {
        if (!selectedCompanyId) return;
        try {
            setIsLoading(true);
            const data = await employeeApi.getEmployees(selectedCompanyId, 1, 100, search);
            setEmployees(data.employees);

            // Refresh selected employee if it was updated
            if (selectedEmployee) {
                const updated = data.employees.find(e => e.id === selectedEmployee.id);
                if (updated) setSelectedEmployee(updated);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [selectedCompanyId, search]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenLimitModal = () => {
        setConfirmation({
            isOpen: true,
            type: 'warning',
            title: 'Employee Limit Reached',
            message: 'You’ve reached the maximum number of Employees allowed on your current plan. To add more Employees, please upgrade your plan.',
            confirmText: 'Update Plan', // Reverted to Update Plan as per user request to not change UI
            onConfirm: () => {
                setIsAddonModalOpen(true);
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDrawerSubmit = async (data: any) => {
        try {
            if (editingEmployee) {
                if (!selectedCompanyId) throw new Error("No company selected");
                await employeeApi.updateEmployee(selectedCompanyId, editingEmployee.id, data);
            } else {
                await employeeApi.createEmployee(data);
            }
            setIsDrawerOpen(false);
            setEditingEmployee(null); // Reset edit state
            setModalMessage(editingEmployee ? 'The employee has been successfully updated.' : 'The employee has been successfully saved.');
            setShowSuccessModal(true);
            fetchEmployees();
        } catch (error: any) {
            if (error.message && error.message.includes('limit reached')) {
                handleOpenLimitModal();
            } else {
                setToast({ message: error.message || 'Operation failed', type: 'error' });
            }
            throw error;
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsDrawerOpen(true);
        setActiveMenuId(null);
    };

    const handleDeactivate = (employee: Employee) => {
        setActiveMenuId(null);
        setConfirmation({
            isOpen: true,
            type: 'warning',
            title: 'Deactivate Employee?',
            message: `Are you sure you want to deactivate ${employee.fullName}? They will not be able to log in.`,
            onConfirm: async () => {
                try {
                    if (!selectedCompanyId) return;
                    // Assuming updateEmployee handles partial updates including status
                    await employeeApi.updateEmployee(selectedCompanyId, employee.id, { status: 'INACTIVE' } as any);
                    setToast({ message: 'Employee deactivated successfully', type: 'success' });
                    fetchEmployees();
                } catch (error: any) {
                    setToast({ message: error.message || 'Failed to deactivate', type: 'error' });
                } finally {
                    setConfirmation(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleRemove = (employee: Employee) => {
        setActiveMenuId(null);
        setConfirmation({
            isOpen: true,
            type: 'danger',
            title: 'Remove Employee?',
            message: `Are you sure you want to permanently remove ${employee.fullName}? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    if (!selectedCompanyId) return;
                    await employeeApi.deleteEmployee(selectedCompanyId, employee.id);
                    setToast({ message: 'Employee removed successfully', type: 'success' });
                    // Provide feedback - maybe navigate away if selected?
                    if (selectedEmployee?.id === employee.id) setSelectedEmployee(null);
                    fetchEmployees();
                } catch (error: any) {
                    setToast({ message: error.message || 'Failed to remove', type: 'error' });
                } finally {
                    setConfirmation(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Helper for adding new
    const openAddDrawer = () => {
        setEditingEmployee(null);
        setIsDrawerOpen(true);
    };

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
                                openAddDrawer();
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <span className="hidden sm:inline">Add Employee</span>
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
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
                                    <div className="divide-y divide-gray-50 pb-20"> {/* pb-20 for menu space */}
                                        {employees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                onClick={() => setSelectedEmployee(emp)}
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 group ${selectedEmployee?.id === emp.id ? 'bg-blue-50/60' : ''
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
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">{emp.fullName}</h4>
                                                            {emp.status === 'INACTIVE' && (
                                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded font-medium">Inactive</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate">{emp.email || 'No email'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 relative"> {/* Relative for menu */}
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{emp.contactNumber}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {/* Kebab Menu */}
                                                    {activeMenuId === emp.id && (
                                                        <div
                                                            ref={menuRef}
                                                            className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => handleEdit(emp)}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeactivate(emp)}
                                                                className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                                Deactivate
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemove(emp)}
                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
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
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedEmployee.status === 'INACTIVE' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                    {selectedEmployee.status || 'Active'}
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

                                        {/* ... (Other details same as before) */}
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

            {/* Universal Drawer (Add/Edit) */}
            <UniversalDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingEmployee(null);
                }}
                onSubmit={handleDrawerSubmit}
                mode="employee"
                companyId={selectedCompanyId || undefined}
                initialData={editingEmployee || undefined}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title={editingEmployee ? "Employee Updated" : "Employee Added"}
                message={modalMessage}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
                confirmText={confirmation.confirmText}
            />

            {/* Addon Modal */}
            <AddonModal
                isOpen={isAddonModalOpen}
                onClose={() => setIsAddonModalOpen(false)}
                onSuccess={() => {
                    setToast({ message: 'Slots purchased successfully!', type: 'success' });
                    // Optionally refresh data - employees not affected directly unless we show limits here? 
                    // But we can re-fetch just in case.
                    fetchEmployees();
                }}
                onUpgradePlan={() => {
                    setIsAddonModalOpen(false);
                    // Navigate to subscription
                    window.location.href = '/settings?tab=subscription';
                }}
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
