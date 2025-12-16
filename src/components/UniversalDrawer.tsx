import { useState, FormEvent, useEffect } from 'react';
import { X, Plus, Building2, UserPlus } from 'lucide-react';
import { CreateCompanyRequest } from '../types/company.types';
import { CreateEmployeeRequest } from '../types/employee.types';

interface UniversalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    mode: 'company' | 'employee';
    companyId?: string;
    initialData?: any; // For edit mode
}

const UniversalDrawer = ({ isOpen, onClose, onSubmit, mode, companyId, initialData }: UniversalDrawerProps) => {
    // Company Form State
    const [companyData, setCompanyData] = useState<CreateCompanyRequest>({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        departments: [],
    });
    const [departmentInput, setDepartmentInput] = useState('');

    // Employee Form State
    const [employeeData, setEmployeeData] = useState<Partial<CreateEmployeeRequest>>({
        fullName: '',
        address: '',
        nic: 'PENDING',
        employeeId: '',
        contactNumber: '',
        joinedDate: new Date().toISOString().split('T')[0],
        designation: '',
        department: 'General',
        email: '',
        dailyRate: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset forms when drawer opens/closes or mode changes or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (mode === 'company') {
                // If editing company in future
                if (initialData) {
                    setCompanyData(initialData);
                } else {
                    setCompanyData({
                        name: '',
                        email: '',
                        address: '',
                        contactNumber: '',
                        departments: [],
                    });
                }
            } else {
                if (initialData) {
                    // Pre-fill employee data
                    setEmployeeData({
                        ...initialData,
                        // Ensure optional fields are handled or API response mapped correctly
                        // Note: API response might have different field names if not careful, but checked types match mostly.
                        // joinedDate from API is ISO string, input type=date needs YYYY-MM-DD
                        joinedDate: initialData.joinedDate ? new Date(initialData.joinedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    });
                } else {
                    // Reset for new employee
                    setEmployeeData({
                        fullName: '',
                        address: '',
                        nic: 'PENDING',
                        employeeId: '',
                        contactNumber: '',
                        joinedDate: new Date().toISOString().split('T')[0],
                        designation: '',
                        department: 'General',
                        email: '',
                        dailyRate: 0,
                    });
                }
            }
        }
    }, [isOpen, mode, initialData]);

    const handleCompanyChange = (field: keyof CreateCompanyRequest, value: string) => {
        setCompanyData((prev) => ({ ...prev, [field]: value }));
    };

    const handleEmployeeChange = (field: keyof CreateEmployeeRequest, value: any) => {
        setEmployeeData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddDepartment = () => {
        if (departmentInput.trim() && !companyData.departments.includes(departmentInput.trim())) {
            setCompanyData((prev) => ({
                ...prev,
                departments: [...prev.departments, departmentInput.trim()],
            }));
            setDepartmentInput('');
        }
    };

    const handleRemoveDepartment = (dept: string) => {
        setCompanyData((prev) => ({
            ...prev,
            departments: prev.departments.filter((d) => d !== dept),
        }));
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Phone must start with +94 and followed by digits (e.g. +94 771234567)
        // User example: +94 711186028. Allowing optional space.
        const phoneRegex = /^\+94\s?\d{9}$/;

        if (mode === 'company') {
            if (companyData.email && !emailRegex.test(companyData.email)) {
                newErrors.email = "Invalid email format";
            }
            if (companyData.contactNumber && !phoneRegex.test(companyData.contactNumber)) {
                newErrors.contactNumber = "Phone must match format: +94 7xxxxxxx";
            }
        } else {
            if (employeeData.email && !emailRegex.test(employeeData.email)) {
                newErrors.email = "Invalid email format";
            }
            if (employeeData.contactNumber && !phoneRegex.test(employeeData.contactNumber)) {
                newErrors.contactNumber = "Phone must match format: +94 7xxxxxxx";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            if (mode === 'company') {
                await onSubmit(companyData);
                // Don't reset if editing? For now assume close on submit
            } else {
                if (!companyId && !initialData) { // If editing, maybe we don't need companyId passed if it's in data? But safe to require.
                    // Actually for update, companyId is required by API
                    if (!companyId && !employeeData.companyId) throw new Error("Company ID is missing");
                }

                const finalEmployeeData = {
                    ...employeeData,
                    companyId: companyId || employeeData.companyId,
                    // Ensure defaults if empty
                    department: employeeData.department || 'General',
                    nic: employeeData.nic || 'PENDING',
                } as CreateEmployeeRequest;

                await onSubmit(finalEmployeeData);
            }
        } catch (error) {
            console.error(error);
            // Parent handles toast? Yes.
            throw error; // Rethrow so parent catches it for limit modal
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isCompany = mode === 'company';
    const isEdit = !!initialData;
    const title = isCompany
        ? (isEdit ? 'Edit Company' : 'Add New Company')
        : (isEdit ? 'Edit Employee' : 'Add New Employee');
    const Icon = isCompany ? Building2 : UserPlus;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            {isCompany ? (
                                /* COMPANY FORM */
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="bg-blue-600 p-1.5 rounded">
                                                <Building2 className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Company Information</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Company Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={companyData.name}
                                                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                                                    placeholder="Enter company name"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Address */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={companyData.address}
                                                    onChange={(e) => handleCompanyChange('address', e.target.value)}
                                                    placeholder="Enter company address"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Email and Phone */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={companyData.email}
                                                        onChange={(e) => handleCompanyChange('email', e.target.value)}
                                                        placeholder="company@example.com"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                    />
                                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={companyData.contactNumber}
                                                        onChange={(e) => handleCompanyChange('contactNumber', e.target.value)}
                                                        placeholder="+94 77 123 0000"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${errors.contactNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                    />
                                                    {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Hidden Departments */}
                                        {/* <div className="pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label> ... </div> */}
                                    </div>
                                </>
                            ) : (
                                /* EMPLOYEE FORM */
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="bg-green-600 p-1.5 rounded">
                                                <UserPlus className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Employee Information</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Full Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={employeeData.fullName}
                                                    onChange={(e) => handleEmployeeChange('fullName', e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Employee ID (Manual Input) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={employeeData.employeeId}
                                                    onChange={(e) => handleEmployeeChange('employeeId', e.target.value)}
                                                    placeholder="EMP001"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Email (New) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={employeeData.email}
                                                    onChange={(e) => handleEmployeeChange('email', e.target.value)}
                                                    placeholder="employee@example.com"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                            </div>

                                            {/* ... */}

                                            {/* Contact Number */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={employeeData.contactNumber}
                                                    onChange={(e) => handleEmployeeChange('contactNumber', e.target.value)}
                                                    placeholder="+94 77 123 4567"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${errors.contactNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                            </div>
                                            {/* Designation */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={employeeData.designation}
                                                    onChange={(e) => handleEmployeeChange('designation', e.target.value)}
                                                    placeholder="Software Engineer"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Daily Rate */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (Rs)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={employeeData.dailyRate || ''}
                                                    onChange={(e) => handleEmployeeChange('dailyRate', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            {/* Address */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={employeeData.address}
                                                    onChange={(e) => handleEmployeeChange('address', e.target.value)}
                                                    placeholder="123 Street, City"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        
                                            {/* Joined Date */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={employeeData.joinedDate}
                                                    onChange={(e) => handleEmployeeChange('joinedDate', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            {/* Hidden Fields */}
                                            <input type="hidden" value={employeeData.department} />
                                            <input type="hidden" value={employeeData.nic} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isCompany ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Finish')}
                        </button>
                    </div>
                </div >
            </div >
        </>
    );
};

export default UniversalDrawer;
