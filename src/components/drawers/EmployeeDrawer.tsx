import { useState, FormEvent, useEffect } from "react";
import {
    PlusCircle, MinusCircle, UploadCloud, Activity, MapPin, Phone, Mail,
    UserRound, Landmark, Home as HomeIcon, ListOrdered, CreditCard, Hotel,
    ListFilter, X, Award, Calendar, Banknote, Wallet
} from "lucide-react";
import FileUploadModal from "../FileUploadModal";
import { CreateEmployeeRequest } from "../../types/employee.types";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Toggle, SRI_LANKAN_BANKS } from "./drawerConstants";
import { validateEmployeeField } from "./drawerValidation";

interface EmployeeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any, files?: File[], fileTitles?: Record<number, string>) => Promise<void>;
    companyId?: string;
    initialData?: any;
}

const EmployeeDrawer = ({ isOpen, onClose, onSubmit, companyId, initialData }: EmployeeDrawerProps) => {
    const [employeeData, setEmployeeData] = useState<Partial<CreateEmployeeRequest>>({
        fullName: "", address: "", employeeId: "", contactNumber: "",
        joinedDate: new Date().toISOString().split("T")[0],
        designation: "", department: "General", email: "",
        basicSalary: 0, salaryType: "DAILY", paidLeave: 0, otRate: 0,
        epfEnabled: true, allowanceEnabled: false, deductionEnabled: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"employee" | "payment" | "bank">("employee");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);
    const [employeeFileTitles, setEmployeeFileTitles] = useState<Record<number, string>>({});
    const [epfEtf, setEpfEtf] = useState("");
    const [epfEnabled, setEpfEnabled] = useState(false);
    const [allowanceEnabled, setAllowanceEnabled] = useState(false);
    const [deductionEnabled, setDeductionEnabled] = useState(false);
    const [allowances, setAllowances] = useState<{ type: string; amount: string }[]>([{ type: "", amount: "" }]);
    const [deductions, setDeductions] = useState<{ type: string; amount: string }[]>([{ type: "", amount: "" }]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isAccountNameEdited, setIsAccountNameEdited] = useState(false);
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
                setAllowanceEnabled(false);
                setDeductionEnabled(false);
                setAllowances([{ type: "", amount: "" }]);
                setDeductions([{ type: "", amount: "" }]);
            } else {
                const draftKey = `employee_add_draft_${companyId}`;
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    try {
                        const draft = JSON.parse(savedDraft);
                        setEmployeeData(draft.employeeData || {});
                        setEpfEnabled(draft.epfEnabled ?? true);
                        setEpfEtf(draft.epfEtf || "");
                        setAllowanceEnabled(draft.allowanceEnabled ?? false);
                        setDeductionEnabled(draft.deductionEnabled ?? false);
                        setAllowances(draft.allowances || [{ type: "", amount: "" }]);
                        setDeductions(draft.deductions || [{ type: "", amount: "" }]);
                    } catch (e) { console.error("Failed to parse draft", e); }
                } else {
                    setEmployeeData({
                        fullName: "", address: "", employeeId: "", contactNumber: "",
                        joinedDate: new Date().toISOString().split("T")[0],
                        designation: "", department: "General", email: "",
                        basicSalary: 0, salaryType: "DAILY", paidLeave: 0, otRate: 0,
                        epfEnabled: true, allowanceEnabled: false, deductionEnabled: false,
                    });
                    setEpfEnabled(true);
                    setEpfEtf("");
                    setAllowanceEnabled(false);
                    setDeductionEnabled(false);
                    setAllowances([{ type: "", amount: "" }]);
                    setDeductions([{ type: "", amount: "" }]);
                }
                setEmployeeFiles([]);
            }
        }
    }, [isOpen, initialData, companyId]);

    useEffect(() => {
        if (isOpen && !initialData) setEpfEnabled(false);
    }, [isOpen, initialData]);

    useEffect(() => {
        if (isOpen && initialData) {
            const internalAllowances = initialData.recurringAllowances || [];
            const hasAllowances = internalAllowances.length > 0;
            setAllowanceEnabled(!!initialData.allowanceEnabled || hasAllowances);
            setAllowances(hasAllowances
                ? internalAllowances.map((a: any) => ({ type: a.type || "", amount: a.amount !== undefined ? a.amount.toString() : "" }))
                : [{ type: "", amount: "" }]);

            const internalDeductions = initialData.recurringDeductions || [];
            const hasDeductions = internalDeductions.length > 0;
            setDeductionEnabled(!!initialData.deductionEnabled || hasDeductions);
            setDeductions(hasDeductions
                ? internalDeductions.map((d: any) => ({ type: d.type || "", amount: d.amount !== undefined ? d.amount.toString() : "" }))
                : [{ type: "", amount: "" }]);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (isOpen && !initialData && companyId) {
            const draftKey = `employee_add_draft_${companyId}`;
            const isDirty = employeeData.fullName || employeeData.employeeId || employeeData.contactNumber || employeeData.email ||
                (allowances.length > 1 || allowances[0].type || allowances[0].amount) ||
                (deductions.length > 1 || deductions[0].type || deductions[0].amount);
            if (isDirty) {
                localStorage.setItem(draftKey, JSON.stringify({ employeeData, epfEtf, epfEnabled, allowanceEnabled, deductionEnabled, allowances, deductions }));
            } else {
                localStorage.removeItem(draftKey);
            }
        }
    }, [employeeData, epfEtf, epfEnabled, allowanceEnabled, deductionEnabled, allowances, deductions, initialData, companyId, isOpen]);

    useEffect(() => {
        if (employeeData.fullName && !isAccountNameEdited) {
            handleEmployeeChange("accountHolderName", employeeData.fullName);
        }
    }, [employeeData.fullName, isAccountNameEdited]);

    const getValidationContext = () => ({
        epfEnabled,
        epfEtf,
        basicSalary: Number(employeeData.basicSalary),
        salaryType: employeeData.salaryType,
    });

    const handleEmployeeChange = (field: keyof CreateEmployeeRequest, value: any) => {
        setEmployeeData((prev) => ({ ...prev, [field]: value }));
        const error = validateEmployeeField(field, value, getValidationContext());
        setErrors((prev) => ({ ...prev, [field]: error }));
        if (field === "basicSalary" || field === "salaryType") {
            const epfError = validateEmployeeField("epfEtf", epfEtf, getValidationContext());
            setErrors((prev) => ({ ...prev, epfEtf: epfError }));
        }
        if (value && String(value).trim() !== "") setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const value = (employeeData as any)[field];
        const error = validateEmployeeField(field, value, getValidationContext());
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            if (target.tagName === "TEXTAREA") return;
            e.preventDefault();
            const container = e.currentTarget as HTMLElement;
            const inputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')) as HTMLElement[];
            const index = inputs.indexOf(target);
            if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
        }
    };

    const isTabValid = (tab: typeof activeTab) => {
        if (tab === "employee") {
            return ["fullName", "employeeId", "contactNumber", "joinedDate", "employeeNIC", "epfNumber"].every(
                (f) => !validateEmployeeField(f, (employeeData as any)[f], getValidationContext())
            );
        }
        if (tab === "payment") {
            return !validateEmployeeField("basicSalary", employeeData.basicSalary, getValidationContext()) &&
                !(epfEnabled && validateEmployeeField("epfEtf", epfEtf, getValidationContext()));
        }
        if (tab === "bank") {
            return ["bankName", "accountNumber", "branchName", "accountHolderName"].every(
                (f) => !validateEmployeeField(f, (employeeData as any)[f], getValidationContext())
            );
        }
        return true;
    };

    const isFormValid = () => {
        const required = ["fullName", "employeeId", "contactNumber", "joinedDate", "employeeNIC", "epfNumber"];
        const bankFields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
        const isBankFilled = bankFields.some((f) => { const v = (employeeData as any)[f]; return v && v.toString().trim() !== ""; });
        const isBankValid = !isBankFilled || bankFields.every((f) => !validateEmployeeField(f, (employeeData as any)[f], getValidationContext()));
        return (
            required.every((f) => !validateEmployeeField(f, (employeeData as any)[f], getValidationContext())) &&
            isBankValid &&
            (!employeeData.email || !validateEmployeeField("email", employeeData.email, getValidationContext())) &&
            (!epfEnabled || !validateEmployeeField("epfEtf", epfEtf, getValidationContext()))
        );
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const fields = ["fullName", "employeeId", "contactNumber", "designation", "otRate", "joinedDate", "address", "email", "employeeNIC", "epfNumber"];
        const ctx = getValidationContext();
        fields.forEach((f) => { const err = validateEmployeeField(f, (employeeData as any)[f], ctx); if (err) newErrors[f] = err; });

        const bankFields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
        const isBankFilled = bankFields.some((f) => { const v = (employeeData as any)[f]; return v && v.toString().trim() !== ""; });
        if (isBankFilled) bankFields.forEach((f) => { const err = validateEmployeeField(f, (employeeData as any)[f], ctx); if (err) newErrors[f] = err; });

        const epfErr = epfEnabled ? validateEmployeeField("epfEtf", epfEtf, ctx) : "";
        if (epfErr) newErrors.epfEtf = epfErr;

        setErrors(newErrors);
        const allTouched: Record<string, boolean> = {};
        [...fields, ...bankFields, "epfEtf"].forEach((f) => (allTouched[f] = true));
        setTouched(allTouched);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            if (!companyId && !initialData && !employeeData.companyId) throw new Error("Company ID is missing");
            const recurringAllowances = allowanceEnabled
                ? allowances.filter((a) => a.type.trim() && a.amount.trim() && parseFloat(a.amount) > 0)
                    .map((a) => ({ type: a.type.trim(), amount: parseFloat(a.amount) }))
                : [];
            const recurringDeductions = deductionEnabled
                ? deductions.filter((d) => d.type.trim() && d.amount.trim() && parseFloat(d.amount) > 0)
                    .map((d) => ({ type: d.type.trim(), amount: parseFloat(d.amount) }))
                : [];
            const finalData = {
                ...employeeData,
                email: employeeData.email?.trim() || "",
                designation: employeeData.designation?.trim() || "",
                address: employeeData.address?.trim() || "",
                companyId: companyId || employeeData.companyId,
                department: employeeData.department || "General",
                basicSalary: parseFloat(String(employeeData.basicSalary)) || 0,
                salaryType: employeeData.salaryType || "DAILY",
                paidLeave: parseInt(String(employeeData.paidLeave)) || 0,
                otRate: parseFloat(String(employeeData.otRate)) || 0,
                epfEnabled,
                epfEtfAmount: epfEnabled && epfEtf ? parseFloat(epfEtf) : undefined,
                allowanceEnabled, deductionEnabled, recurringAllowances, recurringDeductions,
            } as CreateEmployeeRequest;

            await onSubmit(finalData, employeeFiles, employeeFileTitles);
            if (companyId) localStorage.removeItem(`employee_add_draft_${companyId}`);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => { if (!isSubmitting) onClose(); };

    if (!shouldRender) return null;

    const isEdit = !!initialData;
    const title = isEdit ? "Edit Employee" : "Add New Employee";

    return (
        <>
            <div
                className={`fixed inset-0 bg-gray-900/50 z-40 transition-opacity duration-500 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
                onClick={handleClose}
            />
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-lg bg-gray-50 shadow-2xl z-50 transform transition-all duration-500 ease-in-out sm:duration-700 ${isVisible ? "translate-x-0" : "translate-x-full"}`}
                onKeyDown={handleKeyDown}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-5 pt-4 pb-0">
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
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-gray-100">
                            {(["employee", "payment", "bank"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === tab ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab === "employee" ? "Employee Information" : tab === "payment" ? "Salary Information" : "Bank Details"}
                                    {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {activeTab === "employee" ? "Employee Information" : activeTab === "payment" ? "Salary Information" : "Bank Details"}
                                    </h3>
                                </div>
                                <div className="space-y-1.5">

                                    {/* ===== Employee Information Tab ===== */}
                                    {activeTab === "employee" && (
                                        <div className="space-y-1.5">
                                            {/* Employee ID */}
                                            <div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><UserRound className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Employee ID <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <input type="text" value={employeeData.employeeId} onChange={(e) => handleEmployeeChange("employeeId", e.target.value)} onBlur={() => handleBlur("employeeId")} placeholder="Enter Employee ID"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.employeeId && errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                                            </div>

                                            {/* Name */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><UserRound className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Name <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <input type="text" value={employeeData.fullName} onChange={(e) => handleEmployeeChange("fullName", e.target.value)} onBlur={() => handleBlur("fullName")} placeholder="Enter Employee Name"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                            </div>

                                            {/* NIC */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><CreditCard className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">NIC <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <input type="text" value={employeeData.employeeNIC || ""} onChange={(e) => handleEmployeeChange("employeeNIC", e.target.value)} onBlur={() => handleBlur("employeeNIC")} placeholder="Enter Employee NIC Number"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeNIC && errors.employeeNIC ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.employeeNIC && errors.employeeNIC && <p className="text-red-500 text-xs mt-1">{errors.employeeNIC}</p>}
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Address</label>
                                                </div>
                                                <input type="text" value={employeeData.address} onChange={(e) => handleEmployeeChange("address", e.target.value)} onBlur={() => handleBlur("address")} placeholder="Enter Address"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                            </div>

                                            {/* EPF Number */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Activity className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">EPF Number <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <input type="text" value={employeeData.epfNumber || ""} onChange={(e) => handleEmployeeChange("epfNumber", e.target.value)} onBlur={() => handleBlur("epfNumber")} placeholder="Enter EPF Number"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.epfNumber && errors.epfNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.epfNumber && errors.epfNumber && <p className="text-red-500 text-xs mt-1">{errors.epfNumber}</p>}
                                            </div>

                                            {/* Email & Phone */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="relative mt-4">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-blue-500" /></div>
                                                        <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Email (optional)</label>
                                                    </div>
                                                    <input type="email" value={employeeData.email} onChange={(e) => handleEmployeeChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder="employee@example.com"
                                                        className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                    {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                                </div>
                                                <div>
                                                    <div className="relative mt-4">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-blue-500" /></div>
                                                        <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Phone Number <strong className="text-red-600 text-[15px]">*</strong></label>
                                                    </div>
                                                    <input type="tel" value={employeeData.contactNumber} onChange={(e) => handleEmployeeChange("contactNumber", e.target.value)} onBlur={() => handleBlur("contactNumber")} placeholder="0771234567"
                                                        className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                    {touched.contactNumber && errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                                                </div>
                                            </div>

                                            {/* Designation */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Award className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Designation</label>
                                                </div>
                                                <input type="text" value={employeeData.designation} onChange={(e) => handleEmployeeChange("designation", e.target.value.replace(/[0-9]/g, ""))} onBlur={() => handleBlur("designation")} placeholder="Enter Employee Designation"
                                                    className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.designation && errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                                            </div>

                                            {/* Joined Date */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Joined Date <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        value={employeeData.joinedDate ? dayjs(employeeData.joinedDate) : null}
                                                        onChange={(newValue) => handleEmployeeChange("joinedDate", newValue ? newValue.format("YYYY-MM-DD") : "")}
                                                        slotProps={{
                                                            textField: {
                                                                size: "small",
                                                                onBlur: () => handleBlur("joinedDate"),
                                                                error: !!(touched.joinedDate && errors.joinedDate),
                                                                sx: {
                                                                    width: "100%",
                                                                    "& .MuiOutlinedInput-root": {
                                                                        borderRadius: "0.5rem",
                                                                        "& fieldset": { borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#d1d5db" },
                                                                        "&:hover fieldset": { borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#9ca3af" },
                                                                        "&.Mui-focused fieldset": { borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#367AFF", borderWidth: "1px", boxShadow: (touched.joinedDate && errors.joinedDate) ? "0 0 0 2px rgba(239,68,68,0.2)" : "0 0 0 2px rgba(54,122,255,0.2)" },
                                                                    },
                                                                    "& .MuiInputBase-input": { paddingY: "6px", paddingX: "12px", fontSize: "13px", color: "#374151" }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                                {touched.joinedDate && errors.joinedDate && <p className="text-red-500 text-xs mt-1">{errors.joinedDate}</p>}
                                            </div>

                                            {/* Supporting Documents */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><UploadCloud className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Supporting Documents (Max 3)</label>
                                                </div>
                                                {initialData?.documents && initialData.documents.length > 0 && (
                                                    <div className="mb-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-[13px] text-gray-500 font-medium">{initialData.documents.length} document(s) already uploaded</span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    disabled={((initialData?.documents?.length || 0) + employeeFiles.length) >= 3}
                                                    className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-[13px] text-gray-500 font-medium group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                                                >
                                                    <span className="text-gray-400 text-[13px] font-light">
                                                        {((initialData?.documents?.length || 0) + employeeFiles.length) >= 3 ? "Document limit reached" : "Upload Employee Documents"}
                                                    </span>
                                                    <div className="ml-auto w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors">
                                                        <PlusCircle className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600" />
                                                    </div>
                                                </button>
                                                {employeeFiles.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        {employeeFiles.map((file, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-xl text-[12px] text-gray-700 font-medium">
                                                                <span className="truncate max-w-[85%]">{file.name}</span>
                                                                <button type="button" onClick={() => {
                                                                    const newFiles = employeeFiles.filter((_, i) => i !== idx);
                                                                    setEmployeeFiles(newFiles);
                                                                    const newTitles: Record<number, string> = {};
                                                                    let newIdx = 0;
                                                                    for (let i = 0; i < employeeFiles.length; i++) {
                                                                        if (i !== idx) { if (employeeFileTitles[i]) newTitles[newIdx] = employeeFileTitles[i]; newIdx++; }
                                                                    }
                                                                    setEmployeeFileTitles(newTitles);
                                                                }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <FileUploadModal
                                                    isOpen={isUploadModalOpen}
                                                    onClose={() => setIsUploadModalOpen(false)}
                                                    files={employeeFiles}
                                                    onFilesChange={setEmployeeFiles}
                                                    fileTitles={employeeFileTitles}
                                                    onTitlesChange={setEmployeeFileTitles}
                                                    maxFiles={3 - (initialData?.documents?.length || 0)}
                                                />
                                            </div>
                                            <input type="hidden" value={employeeData.department} />
                                        </div>
                                    )}

                                    {/* ===== Salary Information Tab ===== */}
                                    {activeTab === "payment" && (
                                        <div className="space-y-1.5">
                                            {/* Basic Salary + Type */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Wallet className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Basic Salary <strong className="text-red-600 text-[15px]">*</strong></label>
                                                </div>
                                                <div className="flex">
                                                    <input type="number" min="0" value={employeeData.basicSalary || ""}
                                                        onChange={(e) => handleEmployeeChange("basicSalary", parseFloat(e.target.value) || 0)}
                                                        onBlur={() => handleBlur("basicSalary")}
                                                        placeholder={employeeData.salaryType === "MONTHLY" ? "Enter Employee's Monthly Basic" : "Enter Employee's Daily Basic"}
                                                        className={`text-[13px] w-full px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.basicSalary && errors.basicSalary ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                    <select value={employeeData.salaryType || "DAILY"} onChange={(e) => handleEmployeeChange("salaryType", e.target.value as "DAILY" | "MONTHLY")}
                                                        className="ml-2 px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none cursor-pointer">
                                                        <option value="MONTHLY">Monthly</option>
                                                        <option value="DAILY">Daily</option>
                                                    </select>
                                                </div>
                                                {touched.basicSalary && errors.basicSalary && <p className="text-red-500 text-[12px] mt-1">{errors.basicSalary}</p>}
                                            </div>

                                            {/* Paid Leave (Monthly only) */}
                                            {employeeData.salaryType === "MONTHLY" && (
                                                <div>
                                                    <div className="relative mt-4">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-blue-500" /></div>
                                                        <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Paid Leave Count</label>
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                                            <div className="bg-gray-50 px-1 py-1.5 rounded-lg border border-gray-100 text-[11px] font-bold text-gray-400">Days</div>
                                                        </div>
                                                        <input
                                                            type="text" inputMode="numeric"
                                                            value={employeeData.paidLeave === 0 ? "" : employeeData.paidLeave || ""}
                                                            onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); handleEmployeeChange("paidLeave", parseInt(val) || 0); }}
                                                            onBlur={() => handleBlur("paidLeave")}
                                                            placeholder="0"
                                                            style={{ paddingLeft: "80px" }}
                                                            className={`text-[13px] w-full pr-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.paidLeave && errors.paidLeave ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                    </div>
                                                    {touched.paidLeave && errors.paidLeave && <p className="text-red-500 text-xs mt-1">{errors.paidLeave}</p>}
                                                </div>
                                            )}

                                            {/* OT Rate */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Banknote className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">OT Rate (Rs/hr)</label>
                                                </div>
                                                <input type="number" min="0" value={employeeData.otRate || ""} onChange={(e) => handleEmployeeChange("otRate", parseFloat(e.target.value) || 0)} onBlur={() => handleBlur("otRate")} placeholder="Enter OT Rate (Rs)"
                                                    className={`text-[13px] w-full px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.otRate && errors.otRate ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.otRate && errors.otRate && <p className="text-red-500 text-xs mt-1">{errors.otRate}</p>}
                                            </div>

                                            {/* EPF/ETF */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-2 mt-4">
                                                    <Toggle enabled={epfEnabled} onToggle={() => {
                                                        const newVal = !epfEnabled;
                                                        setEpfEnabled(newVal);
                                                        if (!newVal) setErrors((prev) => ({ ...prev, epfEtf: "" }));
                                                        else { const err = validateEmployeeField("epfEtf", epfEtf, getValidationContext()); setErrors((prev) => ({ ...prev, epfEtf: err })); }
                                                    }} />
                                                    <span className="text-[13px] font-medium text-gray-700">EPF/ETF</span>
                                                    {epfEnabled && (
                                                        <div className="relative">
                                                            <input type="number" min="0" value={epfEtf}
                                                                onChange={(e) => { const val = e.target.value; setEpfEtf(val); const err = validateEmployeeField("epfEtf", val, getValidationContext()); setErrors((prev) => ({ ...prev, epfEtf: err })); }}
                                                                onBlur={() => { setTouched((prev) => ({ ...prev, epfEtf: true })); const err = validateEmployeeField("epfEtf", epfEtf, getValidationContext()); setErrors((prev) => ({ ...prev, epfEtf: err })); }}
                                                                placeholder="Enter Employee's EPF/ETF Applicable Amount"
                                                                className={`text-[13px] w-[330px] px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.epfEtf && errors.epfEtf ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                            {touched.epfEtf && errors.epfEtf && <p className="text-red-500 text-[11px] absolute top-full mt-1 left-0 whitespace-nowrap">{errors.epfEtf}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Allowances */}
                                            <div>
                                                <div className="flex items-center gap-3 mt-4 mb-2">
                                                    <Toggle enabled={allowanceEnabled} onToggle={() => setAllowanceEnabled(!allowanceEnabled)} />
                                                    <span className="text-[13px] font-medium text-gray-700">Allowance</span>
                                                </div>
                                                {allowanceEnabled && (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-[1fr_1fr_36px] gap-3">
                                                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Type</span>
                                                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Amount</span>
                                                            <span></span>
                                                        </div>
                                                        {allowances.map((allowance, index) => (
                                                            <div key={index} className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center">
                                                                <input type="text" value={allowance.type} onChange={(e) => { const u = [...allowances]; u[index].type = e.target.value; setAllowances(u); }} placeholder="Travelling" className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all" />
                                                                <input type="number" min="0" value={allowance.amount} onChange={(e) => { const u = [...allowances]; u[index].amount = e.target.value; setAllowances(u); }} placeholder="15,000.00" className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                <button type="button" onClick={() => { if (allowances.length > 1) setAllowances(allowances.filter((_, i) => i !== index)); }} disabled={allowances.length <= 1} className="flex items-center justify-center">
                                                                    <MinusCircle className={`w-5 h-5 ${allowances.length <= 1 ? "text-gray-300" : "text-red-400 hover:text-red-600 cursor-pointer"} transition-colors`} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div onClick={() => { const last = allowances[allowances.length - 1]; if (!last.type.trim() || !last.amount) return; setAllowances([...allowances, { type: "", amount: "" }]); }}
                                                            className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                                                <ListFilter className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                                                <span className="text-[12px] text-gray-400 group-hover:text-blue-500 transition-colors">Add Extra Allowances</span>
                                                            </div>
                                                            <div className="px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors"><span className="text-[12px] text-gray-400">Enter Amount</span></div>
                                                            <div className="flex items-center justify-center"><PlusCircle className="w-5 h-5 text-blue-400 group-hover:text-[#367AFF] transition-colors" /></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Deductions */}
                                            <div>
                                                <div className="flex items-center gap-3 mt-4 mb-2">
                                                    <Toggle enabled={deductionEnabled} onToggle={() => setDeductionEnabled(!deductionEnabled)} />
                                                    <span className="text-[13px] font-medium text-gray-700">Recurring Deductions</span>
                                                </div>
                                                {deductionEnabled && (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-[1fr_1fr_36px] gap-3">
                                                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Type</span>
                                                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">Amount (Rs)</span>
                                                            <span></span>
                                                        </div>
                                                        {deductions.map((deduction, index) => (
                                                            <div key={index} className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center">
                                                                <input type="text" value={deduction.type} onChange={(e) => { const u = [...deductions]; u[index].type = e.target.value; setDeductions(u); }} placeholder="Loan" className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all" />
                                                                <input type="number" min="0" value={deduction.amount} onChange={(e) => { const u = [...deductions]; u[index].amount = e.target.value; setDeductions(u); }} placeholder="Amount" className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                <button type="button" onClick={() => { if (deductions.length > 1) setDeductions(deductions.filter((_, i) => i !== index)); }} disabled={deductions.length <= 1} className="flex items-center justify-center">
                                                                    <MinusCircle className={`w-5 h-5 ${deductions.length <= 1 ? "text-gray-300" : "text-red-400 hover:text-red-600 cursor-pointer"} transition-colors`} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div onClick={() => { const last = deductions[deductions.length - 1]; if (!last.type.trim() || !last.amount) return; setDeductions([...deductions, { type: "", amount: "" }]); }}
                                                            className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors">
                                                                <ListFilter className="w-4 h-4 text-red-300 group-hover:text-red-500 transition-colors" />
                                                                <span className="text-[12px] text-gray-400 group-hover:text-red-500 transition-colors">Add Deduction</span>
                                                            </div>
                                                            <div className="px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors"><span className="text-[12px] text-gray-400">Enter Amount</span></div>
                                                            <div className="flex items-center justify-center"><PlusCircle className="w-5 h-5 text-blue-400 group-hover:text-red-500 transition-colors" /></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ===== Bank Details Tab ===== */}
                                    {activeTab === "bank" && (
                                        <div className="space-y-1.5">
                                            {/* Account Holder Name */}
                                            <div>
                                                <div className="relative mt-1">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><UserRound className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Account Holder Name</label>
                                                </div>
                                                <input type="text" value={employeeData.accountHolderName ?? ""} onChange={(e) => { setIsAccountNameEdited(true); handleEmployeeChange("accountHolderName", e.target.value); }} placeholder="Enter Your Account Holder Name"
                                                    className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountHolderName && errors.accountHolderName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.accountHolderName && errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                                            </div>
                                            {/* Bank Name */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><Landmark className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Bank Name</label>
                                                </div>
                                                <select value={employeeData.bankName || ""} onChange={(e) => handleEmployeeChange("bankName", e.target.value)} onBlur={() => handleBlur("bankName")}
                                                    className={`text-[13px] w-full pr-10 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] ${touched.bankName && errors.bankName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}>
                                                    <option value="">Select Bank</option>
                                                    {SRI_LANKAN_BANKS.map((bank) => (<option key={bank} value={bank}>{bank}</option>))}
                                                </select>
                                                {touched.bankName && errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                            </div>
                                            {/* Branch */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><HomeIcon className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Branch</label>
                                                </div>
                                                <input type="text" value={employeeData.branchName || ""} onChange={(e) => handleEmployeeChange("branchName", e.target.value)} placeholder="Branch Name"
                                                    className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.branchName && errors.branchName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.branchName && errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>}
                                            </div>
                                            {/* Account Number */}
                                            <div>
                                                <div className="relative mt-4">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none"><ListOrdered className="h-4 w-4 text-blue-500" /></div>
                                                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">Account Number</label>
                                                </div>
                                                <input type="text" value={employeeData.accountNumber || ""} onChange={(e) => handleEmployeeChange("accountNumber", e.target.value)} placeholder="Enter Your Account Number"
                                                    className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountNumber && errors.accountNumber ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`} />
                                                {touched.accountNumber && errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 flex justify-center">
                        {activeTab === "bank" ? (
                            <button type="submit" onClick={handleSubmit} disabled={isSubmitting || !isFormValid()}
                                className="w-full max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Finish"}
                            </button>
                        ) : (
                            <button type="button" onClick={() => { if (activeTab === "employee") setActiveTab("payment"); else if (activeTab === "payment") setActiveTab("bank"); }}
                                disabled={!isTabValid(activeTab)}
                                className="w-full max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeDrawer;
