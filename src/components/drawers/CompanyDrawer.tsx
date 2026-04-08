import { useState, FormEvent, useEffect } from "react";
import { MapPin, Phone, Mail, Hotel, X } from "lucide-react";
import { CreateCompanyRequest } from "../../types/company.types";
import { validateCompanyField } from "./drawerValidation";

interface CompanyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCompanyRequest) => Promise<void>;
    initialData?: Partial<CreateCompanyRequest>;
}

const CompanyDrawer = ({ isOpen, onClose, onSubmit, initialData }: CompanyDrawerProps) => {
    const [companyData, setCompanyData] = useState<CreateCompanyRequest>({
        name: "",
        email: "",
        address: "",
        contactNumber: "",
        departments: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

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

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setTouched({});
            if (initialData) {
                setCompanyData({
                    name: initialData.name || "",
                    email: initialData.email || "",
                    address: initialData.address || "",
                    contactNumber: initialData.contactNumber || "",
                    departments: initialData.departments || [],
                });
            } else {
                setCompanyData({ name: "", email: "", address: "", contactNumber: "", departments: [] });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof CreateCompanyRequest, value: string) => {
        setCompanyData((prev) => ({ ...prev, [field]: value }));
        const error = validateCompanyField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const error = validateCompanyField(field, (companyData as any)[field]);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            if (target.tagName === "TEXTAREA") return;
            e.preventDefault();
            const container = e.currentTarget as HTMLElement;
            const inputs = Array.from(
                container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
            ) as HTMLElement[];
            const index = inputs.indexOf(target);
            if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
        }
    };

    const isFormValid = () => {
        const requiredFields: (keyof CreateCompanyRequest)[] = ["name", "email", "address", "contactNumber"];
        return requiredFields.every((f) => !validateCompanyField(f, companyData[f]));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const fields: (keyof CreateCompanyRequest)[] = ["name", "email", "contactNumber", "address"];
        fields.forEach((f) => {
            const err = validateCompanyField(f, companyData[f]);
            if (err) newErrors[f] = err;
        });
        setErrors(newErrors);
        const allTouched: Record<string, boolean> = {};
        fields.forEach((f) => (allTouched[f] = true));
        setTouched(allTouched);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(companyData);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) onClose();
    };

    if (!shouldRender) return null;

    const isEdit = !!initialData;
    const title = isEdit ? "Edit Company" : "Add New Company";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-gray-900/50 z-40 transition-opacity duration-500 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-lg bg-gray-50 shadow-2xl z-50 transform transition-all duration-500 ease-in-out sm:duration-700 ${isVisible ? "translate-x-0" : "translate-x-full"}`}
                onKeyDown={handleKeyDown}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-5 pt-4 pb-4">
                        <div className="flex justify-between">
                            <h2 className="text-[20px] font-bold text-gray-900 mb-4">{title}</h2>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                style={{ borderRadius: "50%" }}
                                className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 border border-gray-300 transition-all duration-300 disabled:opacity-50 mb-2 ${isVisible ? "opacity-100" : "opacity-0"}`}
                            >
                                <X className="w-3 h-3 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-semibold text-gray-900">Company Information</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Company Name */}
                                    <div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                                <Hotel className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <label className="block text-[13px] font-medium text-gray-700 mb-2 pl-6">
                                                Company Name <strong className="text-red-600 text-[15px]">*</strong>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={companyData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            onBlur={() => handleBlur("name")}
                                            placeholder="Enter company name"
                                            className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.name && errors.name ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                        />
                                        {touched.name && errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <label className="block text-[13px] font-medium text-gray-700 mb-2 pl-6">
                                                Address <strong className="text-red-600 text-[15px]">*</strong>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={companyData.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            onBlur={() => handleBlur("address")}
                                            placeholder="Enter company address"
                                            className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                        />
                                        {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                    </div>

                                    {/* Email and Phone */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                                    <Mail className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <label className="block text-[13px] font-medium text-gray-700 mb-2 pl-6">
                                                    Email <strong className="text-red-600 text-[15px]">*</strong>
                                                </label>
                                            </div>
                                            <input
                                                type="email"
                                                value={companyData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                onBlur={() => handleBlur("email")}
                                                placeholder="company@example.com"
                                                className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                            />
                                            {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                                    <Phone className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <label className="block text-[13px] font-medium text-gray-700 mb-2 pl-6">
                                                    Phone Number <strong className="text-red-600 text-[15px]">*</strong>
                                                </label>
                                            </div>
                                            <input
                                                type="tel"
                                                value={companyData.contactNumber}
                                                onChange={(e) => handleChange("contactNumber", e.target.value)}
                                                onBlur={() => handleBlur("contactNumber")}
                                                placeholder="+94 77 123 0000"
                                                className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                            />
                                            {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 flex justify-center">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isFormValid()}
                            className="w-full max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Finish"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CompanyDrawer;
