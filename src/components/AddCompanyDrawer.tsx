import { useState, FormEvent } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { CreateCompanyRequest } from '../types/company.types';

interface AddCompanyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCompanyRequest) => Promise<void>;
}

const AddCompanyDrawer = ({ isOpen, onClose, onSubmit }: AddCompanyDrawerProps) => {
    const [formData, setFormData] = useState<CreateCompanyRequest>({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        departments: [],
    });
    const [departmentInput, setDepartmentInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof CreateCompanyRequest, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddDepartment = () => {
        if (departmentInput.trim() && !formData.departments.includes(departmentInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                departments: [...prev.departments, departmentInput.trim()],
            }));
            setDepartmentInput('');
        }
    };

    const handleRemoveDepartment = (dept: string) => {
        setFormData((prev) => ({
            ...prev,
            departments: prev.departments.filter((d) => d !== dept),
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Reset form
            setFormData({
                name: '',
                address: '',
                email: '',
                contactNumber: '',
                departments: [],
            });
            setDepartmentInput('');
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            // Reset form after animation
            setTimeout(() => {
                setFormData({
                    name: '',
                    address: '',
                    email: '',
                    contactNumber: '',
                    departments: [],
                });
                setDepartmentInput('');
            }, 300);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Add new Company</h2>
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
                            {/* Company Information Section */}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter company name"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Enter company address"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {/* Email and Phone Number Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="company@example.com"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.contactNumber}
                                                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                                placeholder="+1 (555) 123-4567"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Departments Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-blue-600 p-1.5 rounded">
                                        <Plus className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Departments</h3>
                                </div>

                                <div className="space-y-3">
                                    {/* Department Input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={departmentInput}
                                            onChange={(e) => setDepartmentInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddDepartment();
                                                }
                                            }}
                                            placeholder="Department name"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddDepartment}
                                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add
                                        </button>
                                    </div>

                                    {/* Department Chips */}
                                    {formData.departments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.departments.map((dept) => (
                                                <div
                                                    key={dept}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                                >
                                                    <span>{dept}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDepartment(dept)}
                                                        className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Finish'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddCompanyDrawer;
