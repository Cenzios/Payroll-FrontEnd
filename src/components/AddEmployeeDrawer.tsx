import { useState, FormEvent, useEffect } from "react";
import {
    X,
    UserRound,
    CreditCard,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    MinusCircle,
    Landmark,
    Plus,
    Loader2,
    UploadCloud,
    PlusCircle,
} from "lucide-react";
import FileUploadModal from "./FileUploadModal";
import { CreateEmployeeRequest } from "../types/employee.types";
import Toast from "./Toast";

interface AddEmployeeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any, files?: File[]) => Promise<void>;
    companyId?: string;
    initialData?: any; // For edit mode
}

const SRI_LANKAN_BANKS = [
    "Bank of Ceylon (State-owned)",
    "People’s Bank (State-owned)",
    "Commercial Bank of Ceylon PLC",
    "Hatton National Bank PLC (HNB)",
    "Sampath Bank PLC",
    "Seylan Bank PLC",
    "Nations Trust Bank PLC (NTB)",
    "DFCC Bank PLC",
    "National Development Bank PLC (NDB)",
    "Pan Asia Banking Corporation PLC (PABC)",
    "Union Bank of Colombo PLC",
    "Amana Bank PLC (Non-interest based/Islamic banking)",
    "Cargills Bank PLC",
];

const Toggle = ({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) => (
    <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-[#367AFF]" : "bg-gray-300"}`}
    >
        <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-4" : "translate-x-0"}`}
        />
    </button>
);

const AddEmployeeDrawer = ({
    isOpen,
    onClose,
    onSubmit,
    companyId,
    initialData,
}: AddEmployeeDrawerProps) => {
    const [activeTab, setActiveTab] = useState<"employee" | "payment" | "bank">(
        "employee",
    );
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Form State
    const [employeeData, setEmployeeData] = useState<Partial<CreateEmployeeRequest>>({
        fullName: "",
        address: "",
        employeeId: "",
        contactNumber: "",
        joinedDate: new Date().toISOString().split("T")[0],
        designation: "",
        department: "General",
        email: "",
        basicSalary: 0,
        salaryType: "DAILY",
        otRate: 0,
        epfEnabled: true,
        allowanceEnabled: false,
        deductionEnabled: false,
        bankName: "",
        accountNumber: "",
        branchName: "",
        accountHolderName: "",
        employeeNIC: "",
    });

    // Payment tab state
    const [epfEtf, setEpfEtf] = useState("");
    const [epfEnabled, setEpfEnabled] = useState(true);
    const [allowanceEnabled, setAllowanceEnabled] = useState(false);
    const [deductionEnabled, setDeductionEnabled] = useState(false);
    const [allowances, setAllowances] = useState<{ type: string; amount: string }[]>([{ type: "", amount: "" }]);
    const [deductions, setDeductions] = useState<{ type: string; amount: string }[]>([{ type: "", amount: "" }]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const employeePhoneRegex = /^(\+94\d{9}|0\d{9})$/;

    useEffect(() => {
        if (isOpen) {
            setActiveTab("employee");
            setErrors({});
            setTouched({});
            if (initialData) {
                setEmployeeData({
                    ...initialData,
                    joinedDate: initialData.joinedDate
                        ? new Date(initialData.joinedDate).toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0],
                });
                setEpfEnabled(initialData.epfEnabled ?? true);
                setEpfEtf(initialData.epfEtfAmount?.toString() || "");
                setAllowanceEnabled(initialData.allowanceEnabled ?? false);
                setDeductionEnabled(initialData.deductionEnabled ?? false);
                setAllowances(initialData.recurringAllowances?.length ? initialData.recurringAllowances.map((a: any) => ({ type: a.type, amount: a.amount.toString() })) : [{ type: "", amount: "" }]);
                setDeductions(initialData.recurringDeductions?.length ? initialData.recurringDeductions.map((d: any) => ({ type: d.type, amount: d.amount.toString() })) : [{ type: "", amount: "" }]);
            } else {
                setEmployeeData({
                    fullName: "",
                    address: "",
                    employeeId: "",
                    contactNumber: "",
                    joinedDate: new Date().toISOString().split("T")[0],
                    designation: "",
                    department: "General",
                    email: "",
                    basicSalary: 0,
                    salaryType: "DAILY",
                    otRate: 0,
                    epfEnabled: true,
                    allowanceEnabled: false,
                    deductionEnabled: false,
                    bankName: "",
                    accountNumber: "",
                    branchName: "",
                    accountHolderName: "",
                    employeeNIC: "",
                });
                setEpfEnabled(true);
                setEpfEtf("");
                setAllowanceEnabled(false);
                setDeductionEnabled(false);
                setAllowances([{ type: "", amount: "" }]);
                setDeductions([{ type: "", amount: "" }]);
                setEmployeeFiles([]);
            }
        }
    }, [isOpen, initialData]);

    const validateField = (field: string, value: any) => {
        let error = "";
        switch (field) {
            case "fullName":
                if (!value || value.trim().length < 2) error = "Full name must be at least 2 characters";
                else if (/\d/.test(value)) error = "Full name cannot contain numbers";
                break;
            case "employeeId":
                if (!value || !value.trim()) error = "Employee ID is required";
                break;
            case "email":
                if (value && value.trim() && !emailRegex.test(value.trim())) error = "Invalid email format";
                break;
            case "contactNumber":
                if (!value) error = "Contact number is required";
                else if (!employeePhoneRegex.test(value)) error = "Must be +94XXXXXXXXX or 0XXXXXXXXX (10 digits)";
                break;
            case "designation":
                if (value && /\d/.test(value)) error = "Designation cannot contain numbers";
                break;
            case "basicSalary":
                if (value === undefined || value === null || value === "" || isNaN(Number(value))) error = "Basic salary is required";
                else if (Number(value) < 0) error = "Basic salary cannot be negative";
                break;
            case "joinedDate":
                if (!value) error = "Joined date is required";
                else if (new Date(value) > new Date()) error = "Joined date cannot be in the future";
                break;
            case "bankName":
                if (!value || !value.trim()) error = "Bank name is required";
                break;
            case "accountNumber":
                if (!value || !value.trim()) error = "Account number is required";
                else if (!/^\d+$/.test(value.trim())) error = "Account number must contain only digits";
                break;
            case "branchName":
                if (!value || !value.trim()) error = "Branch name is required";
                break;
            case "accountHolderName":
                if (!value || value.trim().length < 2) error = "Account holder name must be at least 2 characters";
                else if (/\d/.test(value)) error = "Account holder name cannot contain numbers";
                break;
            case "employeeNIC":
                if (value && value.trim()) {
                    const nic = value.trim();
                    if (nic.length !== 10 && nic.length !== 12) {
                        error = "NIC must be either 10 or 12 characters long";
                    }
                }
                break;
        }
        return error;
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const error = validateField(field, (employeeData as any)[field]);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleChange = (field: keyof CreateEmployeeRequest, value: any) => {
        setEmployeeData((prev) => ({ ...prev, [field]: value }));
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const isStepValid = (step: typeof activeTab) => {
        if (step === "employee") {
            const fields = ["fullName", "employeeId", "contactNumber", "joinedDate"];
            return fields.every(f => !validateField(f, (employeeData as any)[f]));
        }
        if (step === "payment") {
            return !validateField("basicSalary", employeeData.basicSalary);
        }
        if (step === "bank") {
            const fields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
            return fields.every(f => !validateField(f, (employeeData as any)[f]));
        }
        return true;
    };

    const handleNext = () => {
        if (activeTab === "employee") {
            // Mark all fields in this step as touched
            const fields = ["fullName", "employeeId", "contactNumber", "joinedDate", "employeeNIC", "email", "designation", "address"];
            const newTouched = { ...touched };
            const newErrors = { ...errors };
            fields.forEach(f => {
                newTouched[f] = true;
                newErrors[f] = validateField(f, (employeeData as any)[f]);
            });
            setTouched(newTouched);
            setErrors(newErrors);

            if (isStepValid("employee")) setActiveTab("payment");
            else setToast({ message: "Please correct errors in Employee Information", type: "error" });
        } else if (activeTab === "payment") {
            if (isStepValid("payment")) setActiveTab("bank");
            else setToast({ message: "Please enter a valid basic salary", type: "error" });
        }
    };

    const handleBack = () => {
        if (activeTab === "payment") setActiveTab("employee");
        if (activeTab === "bank") setActiveTab("payment");
    };

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!isStepValid("bank")) {
            setToast({ message: "Please correct errors in Bank Details", type: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Build recurring allowances array
            const recurringAllowances = allowanceEnabled
                ? allowances
                    .filter((a) => a.type.trim() && a.amount.trim() && parseFloat(a.amount) > 0)
                    .map((a) => ({ type: a.type.trim(), amount: parseFloat(a.amount) }))
                : [];

            // Build recurring deductions array
            const recurringDeductions = deductionEnabled
                ? deductions
                    .filter((d) => d.type.trim() && d.amount.trim() && parseFloat(d.amount) > 0)
                    .map((d) => ({ type: d.type.trim(), amount: parseFloat(d.amount) }))
                : [];

            const finalEmployeeData = {
                ...employeeData,
                email: employeeData.email?.trim() || "",
                designation: employeeData.designation?.trim() || "",
                address: employeeData.address?.trim() || "",
                companyId: companyId || (initialData?.companyId),
                department: employeeData.department || "General",
                basicSalary: parseFloat(String(employeeData.basicSalary)) || 0,
                salaryType: employeeData.salaryType || "DAILY",
                otRate: parseFloat(String(employeeData.otRate)) || 0,
                epfEnabled,
                epfEtfAmount: epfEnabled && epfEtf ? parseFloat(epfEtf) : undefined,
                allowanceEnabled,
                deductionEnabled,
                recurringAllowances,
                recurringDeductions,
            } as CreateEmployeeRequest;

            await onSubmit(finalEmployeeData, employeeFiles);
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isEdit = !!initialData;
    const title = isEdit ? "Edit Employee" : "Add New Employee";

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />

            {/* Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-lg w-full flex bg-gray-50 flex-col shadow-2xl animate-slide-in-right">

                {/* Header */}
                <div className="px-6 py-5 bg-white border-b border-gray-100 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 border border-gray-200 rounded-full transition-all text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-6">
                        {[
                            { id: "employee", label: "Employee Information" },
                            { id: "payment", label: "Salary Information" },
                            { id: "bank", label: "Bank Details" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => isStepValid(activeTab) && setActiveTab(tab.id as any)}
                                className={`pb-2 text-[13px] font-semibold transition-colors relative ${activeTab === tab.id ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        {activeTab === "employee" && (
                            <div className="space-y-4">
                                {/* Employee ID */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Employee ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <UserRound className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={employeeData.employeeId}
                                            onChange={(e) => handleChange("employeeId", e.target.value)}
                                            onBlur={() => handleBlur("employeeId")}
                                            placeholder="Enter employee ID"
                                            className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                        />
                                    </div>
                                    {touched.employeeId && errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <UserRound className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={employeeData.fullName}
                                            onChange={(e) => handleChange("fullName", e.target.value)}
                                            onBlur={() => handleBlur("fullName")}
                                            placeholder="Enter employee name"
                                            className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                        />
                                    </div>
                                    {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                </div>

                                {/* NIC & Phone */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">NIC</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={employeeData.employeeNIC}
                                                onChange={(e) => handleChange("employeeNIC", e.target.value)}
                                                onBlur={() => handleBlur("employeeNIC")}
                                                placeholder="NIC Number"
                                                className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.employeeNIC && errors.employeeNIC ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                            />
                                        </div>
                                        {touched.employeeNIC && errors.employeeNIC && <p className="text-red-500 text-xs mt-1">{errors.employeeNIC}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <input
                                                type="tel"
                                                value={employeeData.contactNumber}
                                                onChange={(e) => handleChange("contactNumber", e.target.value)}
                                                onBlur={() => handleBlur("contactNumber")}
                                                placeholder="0XXXXXXXXX"
                                                className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                            />
                                        </div>
                                        {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <input
                                            type="email"
                                            value={employeeData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            onBlur={() => handleBlur("email")}
                                            placeholder="example@mail.com"
                                            className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                        />
                                    </div>
                                    {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                {/* Designation & Joined Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Designation</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                    <Briefcase className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={employeeData.designation}
                                                onChange={(e) => handleChange("designation", e.target.value)}
                                                onBlur={() => handleBlur("designation")}
                                                placeholder="Manager"
                                                className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                            />
                                        </div>
                                        {touched.designation && errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Joined Date</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <input
                                                type="date"
                                                value={employeeData.joinedDate}
                                                onChange={(e) => handleChange("joinedDate", e.target.value)}
                                                onBlur={() => handleBlur("joinedDate")}
                                                className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.joinedDate && errors.joinedDate ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                            />
                                        </div>
                                        {touched.joinedDate && errors.joinedDate && <p className="text-red-500 text-xs mt-1">{errors.joinedDate}</p>}
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Address</label>
                                    <div className="relative">
                                        <div className="absolute top-2.5 left-1.5 pointer-events-none">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <textarea
                                            value={employeeData.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            placeholder="Enter employee address"
                                            rows={2}
                                            className="text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Add Files */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Add Files</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-[13px] text-gray-500 font-medium group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                            <UploadCloud className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        <span>Add Employee Files</span>
                                        <div className="ml-auto w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors">
                                            <PlusCircle className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                    </button>

                                    {employeeFiles.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {employeeFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-xl text-[12px] text-gray-700 font-medium font-sans">
                                                    <span className="truncate max-w-[85%]">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEmployeeFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <FileUploadModal
                                    isOpen={isUploadModalOpen}
                                    onClose={() => setIsUploadModalOpen(false)}
                                    files={employeeFiles}
                                    onFilesChange={setEmployeeFiles}
                                />
                            </div>
                        )}

                        {activeTab === "payment" && (
                            <div className="space-y-6">
                                {/* Basic Salary */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Basic Salary</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                <div className="bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 text-[12px] font-bold text-gray-400">Rs</div>
                                            </div>
                                            <input
                                                type="number"
                                                value={employeeData.basicSalary}
                                                onChange={(e) => handleChange("basicSalary", e.target.value)}
                                                onBlur={() => handleBlur("basicSalary")}
                                                placeholder="0.00"
                                                className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.basicSalary && errors.basicSalary ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                            />
                                        </div>
                                        <select
                                            value={employeeData.salaryType}
                                            onChange={(e) => handleChange("salaryType", e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium outline-none"
                                        >
                                            <option value="DAILY">Daily</option>
                                            <option value="MONTHLY">Monthly</option>
                                        </select>
                                    </div>
                                </div>

                                {/* OT Rate */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">OT Rate (Optional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                            <div className="bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 text-[12px] font-bold text-gray-400">Rs</div>
                                        </div>
                                        <input
                                            type="number"
                                            value={employeeData.otRate}
                                            onChange={(e) => handleChange("otRate", e.target.value)}
                                            placeholder="0.00"
                                            className="text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* EPF Toggle */}
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-800">EPF/ETF Contribution</div>
                                        <div className="text-[12px] text-gray-500">Enable EPF/ETF for this employee</div>
                                    </div>
                                    <Toggle enabled={epfEnabled} onToggle={() => setEpfEnabled(!epfEnabled)} />
                                </div>

                                {/* Allowances Toggle */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-[14px] font-bold text-gray-800">Allowances</div>
                                            <div className="text-[12px] text-gray-500">Add recurring allowances</div>
                                        </div>
                                        <Toggle enabled={allowanceEnabled} onToggle={() => setAllowanceEnabled(!allowanceEnabled)} />
                                    </div>

                                    {allowanceEnabled && (
                                        <div className="space-y-3 pl-4">
                                            {allowances.map((allowance, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Type"
                                                        value={allowance.type}
                                                        onChange={(e) => {
                                                            const newArr = [...allowances];
                                                            newArr[index].type = e.target.value;
                                                            setAllowances(newArr);
                                                        }}
                                                        className="flex-1 px-4 py-2 text-[13px] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={allowance.amount}
                                                        onChange={(e) => {
                                                            const newArr = [...allowances];
                                                            newArr[index].amount = e.target.value;
                                                            setAllowances(newArr);
                                                        }}
                                                        className="w-[120px] px-4 py-2 text-[13px] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => index === 0 ? setAllowances([...allowances, { type: "", amount: "" }]) : setAllowances(allowances.filter((_, i) => i !== index))}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${index === 0 ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                                    >
                                                        {index === 0 ? <Plus className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Deductions Toggle */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-[14px] font-bold text-gray-800">Deductions</div>
                                            <div className="text-[12px] text-gray-500">Add recurring deductions</div>
                                        </div>
                                        <Toggle enabled={deductionEnabled} onToggle={() => setDeductionEnabled(!deductionEnabled)} />
                                    </div>

                                    {deductionEnabled && (
                                        <div className="space-y-3 pl-4">
                                            {deductions.map((deduction, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Type"
                                                        value={deduction.type}
                                                        onChange={(e) => {
                                                            const newArr = [...deductions];
                                                            newArr[index].type = e.target.value;
                                                            setDeductions(newArr);
                                                        }}
                                                        className="flex-1 px-4 py-2 text-[13px] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={deduction.amount}
                                                        onChange={(e) => {
                                                            const newArr = [...deductions];
                                                            newArr[index].amount = e.target.value;
                                                            setDeductions(newArr);
                                                        }}
                                                        className="w-[120px] px-4 py-2 text-[13px] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => index === 0 ? setDeductions([...deductions, { type: "", amount: "" }]) : setDeductions(deductions.filter((_, i) => i !== index))}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${index === 0 ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                                    >
                                                        {index === 0 ? <Plus className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "bank" && (
                            <div className="space-y-4">
                                {/* Bank Name */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Bank Name</label>
                                    <select
                                        value={employeeData.bankName}
                                        onChange={(e) => handleChange("bankName", e.target.value)}
                                        onBlur={() => handleBlur("bankName")}
                                        className={`text-[14px] w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.bankName && errors.bankName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                    >
                                        <option value="">Select Bank</option>
                                        {SRI_LANKAN_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                    </select>
                                    {touched.bankName && errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                </div>

                                {/* Account Number */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Account Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <Landmark className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={employeeData.accountNumber}
                                            onChange={(e) => handleChange("accountNumber", e.target.value)}
                                            onBlur={() => handleBlur("accountNumber")}
                                            placeholder="Enter account number"
                                            className={`text-[14px] w-full pl-12 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountNumber && errors.accountNumber ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                        />
                                    </div>
                                    {touched.accountNumber && errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                                </div>

                                {/* Branch Name */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Branch Name</label>
                                    <input
                                        type="text"
                                        value={employeeData.branchName}
                                        onChange={(e) => handleChange("branchName", e.target.value)}
                                        onBlur={() => handleBlur("branchName")}
                                        placeholder="Enter branch name"
                                        className={`text-[14px] w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.branchName && errors.branchName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                    />
                                    {touched.branchName && errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>}
                                </div>

                                {/* Account Holder Name */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={employeeData.accountHolderName}
                                        onChange={(e) => handleChange("accountHolderName", e.target.value)}
                                        onBlur={() => handleBlur("accountHolderName")}
                                        placeholder="Enter account holder name"
                                        className={`text-[14px] w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountHolderName && errors.accountHolderName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"}`}
                                    />
                                    {touched.accountHolderName && errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer Actions */}
                <div className="border-t border-gray-100 p-6 bg-white shrink-0 flex items-center gap-3 sticky bottom-0 z-10">
                    {activeTab === "bank" ? (
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting || !isStepValid("bank")}
                            className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : isEdit ? "Update Employee" : "Finish"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50"
                        >
                            Next
                        </button>
                    )}
                </div>

            </div>

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

export default AddEmployeeDrawer;
