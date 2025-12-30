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

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+94\s?\d{9}$/;

    const validateField = (field: string, value: any, formMode: 'company' | 'employee') => {
        let error = '';
        if (formMode === 'company') {
            switch (field) {
                case 'name':
                    if (!value || value.trim().length < 2) error = 'Name must be at least 2 characters';
                    break;
                case 'email':
                    if (!value) error = 'Email is required';
                    else if (!emailRegex.test(value)) error = 'Invalid email format';
                    break;
                case 'contactNumber':
                    if (!value) error = 'Contact number is required';
                    else if (!phoneRegex.test(value)) error = 'Must be +94 followed by 9 digits';
                    break;
                case 'address':
                    if (!value || !value.trim()) error = 'Address is required';
                    break;
            }
        } else {
            switch (field) {
                case 'fullName':
                    if (!value || value.trim().length < 2) error = 'Full name must be at least 2 characters';
                    break;
                case 'employeeId':
                    if (!value || !value.trim()) error = 'Employee ID is required';
                    break;
                case 'email':
                    if (value && value.trim() && !emailRegex.test(value.trim())) error = 'Invalid email format';
                    break;
                case 'contactNumber':
                    if (!value) error = 'Contact number is required';
                    else if (!phoneRegex.test(value)) error = 'Must be +94 followed by 9 digits';
                    break;
                case 'designation':
                    if (!value || !value.trim()) error = 'Designation is required';
                    break;
                case 'dailyRate':
                    if (value === undefined || value === null || value === '' || isNaN(Number(value))) error = 'Daily rate is required';
                    else if (Number(value) <= 0) error = 'Daily rate must be a positive number';
                    break;
                case 'joinedDate':
                    if (!value) error = 'Joined date is required';
                    else if (new Date(value) > new Date()) error = 'Joined date cannot be in the future';
                    break;
                case 'address':
                    if (!value || !value.trim()) error = 'Address is required';
                    break;
            }
        }
        return error;
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const value = mode === 'company' ? (companyData as any)[field] : (employeeData as any)[field];
        const error = validateField(field, value, mode);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleCompanyChange = (field: keyof CreateCompanyRequest, value: string) => {
        setCompanyData((prev) => ({ ...prev, [field]: value }));
        const error = validateField(field, value, 'company');
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleEmployeeChange = (field: keyof CreateEmployeeRequest, value: any) => {
        setEmployeeData((prev) => ({ ...prev, [field]: value }));
        const error = validateField(field, value, 'employee');
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const isFormValid = () => {
        if (mode === 'company') {
            const requiredFields: (keyof CreateCompanyRequest)[] = ['name', 'email', 'address', 'contactNumber'];
            return requiredFields.every(field => !validateField(field, companyData[field], 'company'));
        } else {
            const requiredFields: (keyof CreateEmployeeRequest)[] = ['fullName', 'employeeId', 'contactNumber', 'designation', 'dailyRate', 'joinedDate', 'address'];
            return requiredFields.every(field => !validateField(field, (employeeData as any)[field], 'employee')) &&
                (!employeeData.email || !validateField('email', employeeData.email, 'employee'));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (mode === 'company') {
            const fields: (keyof CreateCompanyRequest)[] = ['name', 'email', 'contactNumber', 'address'];
            fields.forEach(f => {
                const err = validateField(f, companyData[f], 'company');
                if (err) newErrors[f] = err;
            });
        } else {
            const fields: (keyof CreateEmployeeRequest)[] = ['fullName', 'employeeId', 'contactNumber', 'designation', 'dailyRate', 'joinedDate', 'address', 'email'];
            fields.forEach(f => {
                const err = validateField(f, (employeeData as any)[f], 'employee');
                if (err) newErrors[f] = err;
            });
        }

        setErrors(newErrors);
        // Mark all as touched on submit attempt
        const allTouched: Record<string, boolean> = {};
        Object.keys(newErrors).forEach(k => allTouched[k] = true);
        if (mode === 'company') {
            ['name', 'email', 'contactNumber', 'address'].forEach(f => allTouched[f] = true);
        } else {
            ['fullName', 'employeeId', 'contactNumber', 'designation', 'dailyRate', 'joinedDate', 'address', 'email'].forEach(f => allTouched[f] = true);
        }
        setTouched(allTouched);

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
                                                    value={companyData.name}
                                                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                                                    onBlur={() => handleBlur('name')}
                                                    placeholder="Enter company name"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.name && errors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.name && errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                            </div>
                                            {/* Address */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    value={companyData.address}
                                                    onChange={(e) => handleCompanyChange('address', e.target.value)}
                                                    onBlur={() => handleBlur('address')}
                                                    placeholder="Enter company address"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                            </div>
                                            {/* Email and Phone */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        value={companyData.email}
                                                        onChange={(e) => handleCompanyChange('email', e.target.value)}
                                                        onBlur={() => handleBlur('email')}
                                                        placeholder="company@example.com"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                    />
                                                    {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={companyData.contactNumber}
                                                        onChange={(e) => handleCompanyChange('contactNumber', e.target.value)}
                                                        onBlur={() => handleBlur('contactNumber')}
                                                        placeholder="+94 77 123 0000"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                    />
                                                    {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
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
                                                    value={employeeData.fullName}
                                                    onChange={(e) => handleEmployeeChange('fullName', e.target.value)}
                                                    onBlur={() => handleBlur('fullName')}
                                                    placeholder="John Doe"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                            </div>
                                            {/* Employee ID (Manual Input) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                                                <input
                                                    type="text"
                                                    value={employeeData.employeeId}
                                                    onChange={(e) => handleEmployeeChange('employeeId', e.target.value)}
                                                    onBlur={() => handleBlur('employeeId')}
                                                    placeholder="EMP001"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.employeeId && errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                                            </div>
                                            {/* Email (New) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                                                <input
                                                    type="email"
                                                    value={employeeData.email}
                                                    onChange={(e) => handleEmployeeChange('email', e.target.value)}
                                                    onBlur={() => handleBlur('email')}
                                                    placeholder="employee@example.com"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                            </div>

                                            {/* Contact Number */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                                <input
                                                    type="tel"
                                                    value={employeeData.contactNumber}
                                                    onChange={(e) => handleEmployeeChange('contactNumber', e.target.value)}
                                                    onBlur={() => handleBlur('contactNumber')}
                                                    placeholder="+94 77 123 4567"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                            </div>
                                            {/* Designation */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                                                <input
                                                    type="text"
                                                    value={employeeData.designation}
                                                    onChange={(e) => handleEmployeeChange('designation', e.target.value)}
                                                    onBlur={() => handleBlur('designation')}
                                                    placeholder="Software Engineer"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.designation && errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                                            </div>
                                            {/* Daily Rate */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (Rs)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={employeeData.dailyRate || ''}
                                                    onChange={(e) => handleEmployeeChange('dailyRate', parseFloat(e.target.value) || 0)}
                                                    onBlur={() => handleBlur('dailyRate')}
                                                    placeholder="0.00"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.dailyRate && errors.dailyRate ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.dailyRate && errors.dailyRate && <p className="text-red-500 text-xs mt-1">{errors.dailyRate}</p>}
                                            </div>
                                            {/* Address */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    value={employeeData.address}
                                                    onChange={(e) => handleEmployeeChange('address', e.target.value)}
                                                    onBlur={() => handleBlur('address')}
                                                    placeholder="123 Street, City"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                            </div>

                                            {/* Joined Date */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                                                <input
                                                    type="date"
                                                    value={employeeData.joinedDate}
                                                    onChange={(e) => handleEmployeeChange('joinedDate', e.target.value)}
                                                    onBlur={() => handleBlur('joinedDate')}
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.joinedDate && errors.joinedDate ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                />
                                                {touched.joinedDate && errors.joinedDate && <p className="text-red-500 text-xs mt-1">{errors.joinedDate}</p>}
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
                            disabled={isSubmitting || !isFormValid()}
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
