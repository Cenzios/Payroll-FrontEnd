import { useState, FormEvent, useEffect } from 'react';
import { X, Building2, UserRound, CreditCard, MapPin, Activity, Mail, Phone, Award, Calendar, Briefcase, PlusCircle, MinusCircle } from 'lucide-react';
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

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
);

const UniversalDrawer = ({ isOpen, onClose, onSubmit, mode, companyId, initialData }: UniversalDrawerProps) => {
    // Company Form State
    const [companyData, setCompanyData] = useState<CreateCompanyRequest>({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        departments: [],
    });

    // Employee Form State
    const [employeeData, setEmployeeData] = useState<Partial<CreateEmployeeRequest>>({
        fullName: '',
        address: '',
        employeeId: '',
        contactNumber: '',
        joinedDate: new Date().toISOString().split('T')[0],
        designation: '',
        department: 'General',
        email: '',
        basicSalary: 0,
        salaryType: 'DAILY',
        otRate: 0,
        epfEnabled: true,
        allowanceEnabled: false,
        deductionEnabled: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'employee' | 'payment'>('employee');

    // Payment tab state
    const [epfEtf, setEpfEtf] = useState('');
    const [epfEnabled, setEpfEnabled] = useState(true);
    const [allowanceEnabled, setAllowanceEnabled] = useState(false);
    const [deductionEnabled, setDeductionEnabled] = useState(false);
    const [allowances, setAllowances] = useState<{ type: string; amount: string }[]>([{ type: '', amount: '' }]);
    const [deductions, setDeductions] = useState<{ type: string; amount: string }[]>([{ type: '', amount: '' }]);

    // Reset forms when drawer opens/closes or mode changes or initialData changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab('employee');
            if (mode === 'company') {
                if (initialData) {
                    setCompanyData(initialData);
                } else {
                    setCompanyData({ name: '', email: '', address: '', contactNumber: '', departments: [] });
                }
            } else {
                if (initialData) {
                    setEmployeeData({
                        ...initialData,
                        joinedDate: initialData.joinedDate
                            ? new Date(initialData.joinedDate).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                    });
                    setEpfEnabled(initialData.epfEnabled ?? true);
                    setEpfEtf(initialData.epfEtfAmount?.toString() || '');
                    setAllowanceEnabled(initialData.allowanceEnabled ?? false);
                    setDeductionEnabled(initialData.deductionEnabled ?? false);
                } else {
                    setEmployeeData({
                        fullName: '',
                        address: '',
                        employeeId: '',
                        contactNumber: '',
                        joinedDate: new Date().toISOString().split('T')[0],
                        designation: '',
                        department: 'General',
                        email: '',
                        basicSalary: 0,
                        salaryType: 'DAILY',
                        otRate: 0,
                        epfEnabled: true,
                        allowanceEnabled: false,
                        deductionEnabled: false,
                    });
                    setEpfEnabled(true);
                    setEpfEtf('');
                    setAllowanceEnabled(false);
                    setDeductionEnabled(false);
                    setAllowances([{ type: '', amount: '' }]);
                    setDeductions([{ type: '', amount: '' }]);
                }
            }
        }
    }, [isOpen, mode, initialData]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+94\s?\d{9}$/;
    const employeePhoneRegex = /^(\+94\d{9}|0\d{9})$/;

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
                    else if (/\d/.test(value)) error = 'Full name cannot contain numbers';
                    break;
                case 'employeeId':
                    if (!value || !value.trim()) error = 'Employee ID is required';
                    break;
                case 'email':
                    if (value && value.trim() && !emailRegex.test(value.trim())) error = 'Invalid email format';
                    break;
                case 'contactNumber':
                    if (!value) error = 'Contact number is required';
                    else if (!employeePhoneRegex.test(value)) error = 'Must be +94XXXXXXXXX or 0XXXXXXXXX (10 digits)';
                    break;
                case 'designation':
                    if (value && /\d/.test(value)) error = 'Designation cannot contain numbers';
                    break;
                case 'basicSalary':
                    if (value === undefined || value === null || value === '' || isNaN(Number(value))) error = 'Basic salary is required';
                    else if (Number(value) < 0) error = 'Basic salary cannot be negative';
                    break;
                case 'otRate':
                    if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) error = 'OT rate must be a number';
                    else if (Number(value) < 0) error = 'OT rate cannot be negative';
                    break;
                case 'joinedDate':
                    if (!value) error = 'Joined date is required';
                    else if (new Date(value) > new Date()) error = 'Joined date cannot be in the future';
                    break;
                case 'address':
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
            const requiredFields: (keyof CreateEmployeeRequest)[] = ['fullName', 'employeeId', 'contactNumber', 'joinedDate'];
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
            const fields: (keyof CreateEmployeeRequest)[] = ['fullName', 'employeeId', 'contactNumber', 'designation', 'otRate', 'joinedDate', 'address', 'email'];
            fields.forEach(f => {
                const err = validateField(f, (employeeData as any)[f], 'employee');
                if (err) newErrors[f] = err;
            });
        }

        setErrors(newErrors);
        const allTouched: Record<string, boolean> = {};
        Object.keys(newErrors).forEach(k => allTouched[k] = true);
        if (mode === 'company') {
            ['name', 'email', 'contactNumber', 'address'].forEach(f => allTouched[f] = true);
        } else {
            ['fullName', 'employeeId', 'contactNumber', 'designation', 'otRate', 'joinedDate', 'address', 'email'].forEach(f => allTouched[f] = true);
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
            } else {
                if (!companyId && !initialData) {
                    if (!companyId && !employeeData.companyId) throw new Error('Company ID is missing');
                }

                // Build recurring allowances array
                const recurringAllowances = allowanceEnabled
                    ? allowances
                        .filter(a => a.type.trim() && a.amount.trim() && parseFloat(a.amount) > 0)
                        .map(a => ({ type: a.type.trim(), amount: parseFloat(a.amount) }))
                    : [];

                // Build recurring deductions array
                const recurringDeductions = deductionEnabled
                    ? deductions
                        .filter(d => d.type.trim() && d.amount.trim() && parseFloat(d.amount) > 0)
                        .map(d => ({ type: d.type.trim(), amount: parseFloat(d.amount) }))
                    : [];

                const finalEmployeeData = {
                    ...employeeData,
                    email: employeeData.email?.trim() || '',
                    designation: employeeData.designation?.trim() || '',
                    address: employeeData.address?.trim() || '',
                    companyId: companyId || employeeData.companyId,
                    department: employeeData.department || 'General',
                    basicSalary: parseFloat(String(employeeData.basicSalary)) || 0,
                    salaryType: employeeData.salaryType || 'DAILY',
                    otRate: parseFloat(String(employeeData.otRate)) || 0,
                    epfEnabled,
                    epfEtfAmount: epfEnabled && epfEtf ? parseFloat(epfEtf) : undefined,
                    allowanceEnabled,
                    deductionEnabled,
                    recurringAllowances,
                    recurringDeductions,
                } as CreateEmployeeRequest;

                await onSubmit(finalEmployeeData);
            }
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    const isCompany = mode === 'company';
    const isEdit = !!initialData;
    const title = isCompany
        ? (isEdit ? 'Edit Company' : 'Add New Company')
        : (isEdit ? 'Edit Employee' : 'Add New Employee');

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-gray-900/50 z-40 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-xl bg-gray-50 shadow-2xl z-50 transform transition-all duration-500 ease-in-out sm:duration-700 rounded-l-2xl ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 pt-5 pb-0">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className={`p-1.5 hover:bg-gray-200 rounded-full transition-all duration-300 disabled:opacity-50 mb-3 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                        {!isCompany && (
                            <div className="flex gap-6 border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('employee')}
                                    className={`pb-2.5 text-sm font-medium transition-colors relative ${activeTab === 'employee' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Employee Information
                                    {activeTab === 'employee' && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('payment')}
                                    className={`pb-2.5 text-sm font-medium transition-colors relative ${activeTab === 'payment' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Payment Information
                                    {activeTab === 'payment' && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
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
                                    </div>
                                </>
                            ) : (
                                /* EMPLOYEE FORM */
                                <>
                                    <div>
                                        <div className="space-y-4">
                                            {/* ===== Employee Information Tab ===== */}
                                            {activeTab === 'employee' && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 p-3 rounded-xl mb-4 bg-blue-50 border border-blue-100">
                                                        <div className="bg-blue-600 p-2 rounded-lg">
                                                            <UserRound className="w-5 h-5 text-white" />
                                                        </div>
                                                        <span className="font-semibold text-gray-800">Employee Information</span>
                                                    </div>

                                                    {/* Employee ID */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <UserRound className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.employeeId}
                                                                onChange={(e) => handleEmployeeChange('employeeId', e.target.value)}
                                                                onBlur={() => handleBlur('employeeId')}
                                                                placeholder="Enter employee ID"
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                        {touched.employeeId && errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                                                    </div>

                                                    {/* Name */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <UserRound className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.fullName}
                                                                onChange={(e) => handleEmployeeChange('fullName', e.target.value)}
                                                                onBlur={() => handleBlur('fullName')}
                                                                placeholder="Enter employee name"
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                        {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                                    </div>

                                                    {/* NIC */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">NIC</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <CreditCard className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.employeeNIC || ''}
                                                                onChange={(e) => handleEmployeeChange('employeeNIC', e.target.value)}
                                                                placeholder="Enter employee NIC Number"
                                                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all border-gray-300 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Address */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <MapPin className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.address}
                                                                onChange={(e) => handleEmployeeChange('address', e.target.value)}
                                                                onBlur={() => handleBlur('address')}
                                                                placeholder="Enter address"
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                        {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                                    </div>

                                                    {/* EPF Number */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">EPF Number</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Activity className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.epfNumber || ''}
                                                                onChange={(e) => handleEmployeeChange('epfNumber', e.target.value)}
                                                                placeholder="Enter EPF Number"
                                                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all border-gray-300 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Email & Phone */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="email"
                                                                    value={employeeData.email}
                                                                    onChange={(e) => handleEmployeeChange('email', e.target.value)}
                                                                    onBlur={() => handleBlur('email')}
                                                                    placeholder="employee@example.com"
                                                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                                />
                                                            </div>
                                                            {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={employeeData.contactNumber}
                                                                    onChange={(e) => handleEmployeeChange('contactNumber', e.target.value)}
                                                                    onBlur={() => handleBlur('contactNumber')}
                                                                    placeholder="0771234567"
                                                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                                />
                                                            </div>
                                                            {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                                        </div>
                                                    </div>

                                                    {/* Designation */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Award className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={employeeData.designation}
                                                                onChange={(e) => {
                                                                    const filteredValue = e.target.value.replace(/[0-9]/g, '');
                                                                    handleEmployeeChange('designation', filteredValue);
                                                                }}
                                                                onBlur={() => handleBlur('designation')}
                                                                placeholder="Enter employee designation"
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                        {touched.designation && errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                                                    </div>

                                                    {/* Joined Date */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Calendar className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="date"
                                                                value={employeeData.joinedDate}
                                                                onChange={(e) => handleEmployeeChange('joinedDate', e.target.value)}
                                                                onBlur={() => handleBlur('joinedDate')}
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.joinedDate && errors.joinedDate ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                        {touched.joinedDate && errors.joinedDate && <p className="text-red-500 text-xs mt-1">{errors.joinedDate}</p>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ===== Payment Information Tab ===== */}
                                            {activeTab === 'payment' && (
                                                <div className="space-y-5">
                                                    {/* Payment Information Banner */}
                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-600 p-2 rounded-lg">
                                                                <Briefcase className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-semibold text-gray-800">Payment Information</span>
                                                        </div>
                                                        <select
                                                            value={employeeData.salaryType || 'DAILY'}
                                                            onChange={(e) => handleEmployeeChange('salaryType', e.target.value as 'DAILY' | 'MONTHLY')}
                                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
                                                        >
                                                            <option value="MONTHLY">Monthly</option>
                                                            <option value="DAILY">Daily</option>
                                                        </select>
                                                    </div>

                                                    {/* Basic Salary */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {employeeData.salaryType === 'MONTHLY' ? 'Monthly Basic Salary' : 'Daily Basic Rate'} (Rs)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={employeeData.basicSalary || ''}
                                                            onChange={(e) => handleEmployeeChange('basicSalary', parseFloat(e.target.value) || 0)}
                                                            onBlur={() => handleBlur('basicSalary')}
                                                            placeholder={employeeData.salaryType === 'MONTHLY' ? 'Enter monthly basic salary' : 'Enter daily rate'}
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.basicSalary && errors.basicSalary ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                        />
                                                        {touched.basicSalary && errors.basicSalary && <p className="text-red-500 text-xs mt-1">{errors.basicSalary}</p>}
                                                    </div>

                                                    {/* EPF/ETF */}
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Toggle enabled={epfEnabled} onToggle={() => setEpfEnabled(!epfEnabled)} />
                                                            <span className="text-sm font-medium text-gray-700">EPF/ETF</span>
                                                        </div>
                                                        {epfEnabled && (
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={epfEtf}
                                                                    onChange={(e) => setEpfEtf(e.target.value)}
                                                                    placeholder="Enter EPF/ETF Amount (Rs)"
                                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* OT Rate */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">OT Rate (Rs/hr)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={employeeData.otRate || ''}
                                                            onChange={(e) => handleEmployeeChange('otRate', parseFloat(e.target.value) || 0)}
                                                            onBlur={() => handleBlur('otRate')}
                                                            placeholder="Enter OT Rate (Rs)"
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.otRate && errors.otRate ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                                        />
                                                        {touched.otRate && errors.otRate && <p className="text-red-500 text-xs mt-1">{errors.otRate}</p>}
                                                    </div>

                                                    {/* ── Allowances ── */}
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Toggle enabled={allowanceEnabled} onToggle={() => setAllowanceEnabled(!allowanceEnabled)} />
                                                            <span className="text-sm font-medium text-gray-700">Recurring Allowances</span>
                                                        </div>

                                                        {allowanceEnabled && (
                                                            <>
                                                                <div className="grid grid-cols-[1fr_1fr_36px] gap-3 mb-2">
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (Rs)</span>
                                                                    <span></span>
                                                                </div>

                                                                {allowances.map((allowance, index) => (
                                                                    <div key={index} className="grid grid-cols-[1fr_1fr_36px] gap-3 mb-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={allowance.type}
                                                                            onChange={(e) => {
                                                                                const updated = [...allowances];
                                                                                updated[index].type = e.target.value;
                                                                                setAllowances(updated);
                                                                            }}
                                                                            placeholder="Travelling"
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={allowance.amount}
                                                                            onChange={(e) => {
                                                                                const updated = [...allowances];
                                                                                updated[index].amount = e.target.value;
                                                                                setAllowances(updated);
                                                                            }}
                                                                            placeholder="Amount"
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (allowances.length > 1) {
                                                                                    setAllowances(allowances.filter((_, i) => i !== index));
                                                                                }
                                                                            }}
                                                                            className="flex items-center justify-center"
                                                                            disabled={allowances.length <= 1}
                                                                        >
                                                                            <MinusCircle className={`w-5 h-5 ${allowances.length <= 1 ? 'text-gray-300' : 'text-red-400 hover:text-red-600 cursor-pointer'} transition-colors`} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                <div
                                                                    onClick={() => setAllowances([...allowances, { type: '', amount: '' }])}
                                                                    className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group mt-1"
                                                                >
                                                                    <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg group-hover:border-blue-300 transition-colors">
                                                                        <PlusCircle className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                                                                        <span className="text-sm text-gray-400">Add Allowance</span>
                                                                    </div>
                                                                    <div className="px-3 py-2 border border-dashed border-gray-300 rounded-lg group-hover:border-blue-300 transition-colors">
                                                                        <span className="text-sm text-gray-400">Amount</span>
                                                                    </div>
                                                                    <div></div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* ── Deductions ── */}
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Toggle enabled={deductionEnabled} onToggle={() => setDeductionEnabled(!deductionEnabled)} />
                                                            <span className="text-sm font-medium text-gray-700">Recurring Deductions</span>
                                                        </div>

                                                        {deductionEnabled && (
                                                            <>
                                                                <div className="grid grid-cols-[1fr_1fr_36px] gap-3 mb-2">
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (Rs)</span>
                                                                    <span></span>
                                                                </div>

                                                                {deductions.map((deduction, index) => (
                                                                    <div key={index} className="grid grid-cols-[1fr_1fr_36px] gap-3 mb-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={deduction.type}
                                                                            onChange={(e) => {
                                                                                const updated = [...deductions];
                                                                                updated[index].type = e.target.value;
                                                                                setDeductions(updated);
                                                                            }}
                                                                            placeholder="Loan"
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm transition-all"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={deduction.amount}
                                                                            onChange={(e) => {
                                                                                const updated = [...deductions];
                                                                                updated[index].amount = e.target.value;
                                                                                setDeductions(updated);
                                                                            }}
                                                                            placeholder="Amount"
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (deductions.length > 1) {
                                                                                    setDeductions(deductions.filter((_, i) => i !== index));
                                                                                }
                                                                            }}
                                                                            className="flex items-center justify-center"
                                                                            disabled={deductions.length <= 1}
                                                                        >
                                                                            <MinusCircle className={`w-5 h-5 ${deductions.length <= 1 ? 'text-gray-300' : 'text-red-400 hover:text-red-600 cursor-pointer'} transition-colors`} />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                <div
                                                                    onClick={() => setDeductions([...deductions, { type: '', amount: '' }])}
                                                                    className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group mt-1"
                                                                >
                                                                    <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-red-200 rounded-lg group-hover:border-red-400 transition-colors">
                                                                        <PlusCircle className="w-4 h-4 text-red-300 group-hover:text-red-500" />
                                                                        <span className="text-sm text-gray-400">Add Deduction</span>
                                                                    </div>
                                                                    <div className="px-3 py-2 border border-dashed border-red-200 rounded-lg group-hover:border-red-400 transition-colors">
                                                                        <span className="text-sm text-gray-400">Amount</span>
                                                                    </div>
                                                                    <div></div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>
                                            )}

                                            {/* Hidden Fields */}
                                            <input type="hidden" value={employeeData.department} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200">
                        {isCompany ? (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isFormValid()}
                                className="w-full text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Finish')}
                            </button>
                        ) : activeTab === 'employee' ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab('payment')}
                                className="w-full text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isFormValid()}
                                className="w-full text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Finish')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UniversalDrawer;
