import { useState, FormEvent, useEffect } from "react";
import {
  X,
  Building2,
  UserRound,
  CreditCard,
  MapPin,
  Activity,
  Mail,
  Phone,
  Award,
  Calendar,
  PlusCircle,
  MinusCircle,
  Globe,
  ListFilter,
  Landmark,
} from "lucide-react";
import { CreateCompanyRequest } from "../types/company.types";
import { CreateEmployeeRequest } from "../types/employee.types";

interface UniversalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  mode: "company" | "employee";
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

const UniversalDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  companyId,
  initialData,
}: UniversalDrawerProps) => {
  // Company Form State
  const [companyData, setCompanyData] = useState<CreateCompanyRequest>({
    name: "",
    email: "",
    address: "",
    contactNumber: "",
    departments: [],
  });

  // Employee Form State
  const [employeeData, setEmployeeData] = useState<
    Partial<CreateEmployeeRequest>
  >({
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"employee" | "payment" | "bank">(
    "employee",
  );
  const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);

  // Payment tab state
  const [epfEtf, setEpfEtf] = useState("");
  const [epfEnabled, setEpfEnabled] = useState(true);
  const [allowanceEnabled, setAllowanceEnabled] = useState(false);
  const [deductionEnabled, setDeductionEnabled] = useState(false);
  const [allowances, setAllowances] = useState<
    { type: string; amount: string }[]
  >([{ type: "", amount: "" }]);
  const [deductions, setDeductions] = useState<
    { type: string; amount: string }[]
  >([{ type: "", amount: "" }]);

  // Reset forms when drawer opens/closes or mode changes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab("employee");
      if (mode === "company") {
        if (initialData) {
          setCompanyData(initialData);
        } else {
          setCompanyData({
            name: "",
            email: "",
            address: "",
            contactNumber: "",
            departments: [],
          });
        }
      } else {
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
          });
          setEpfEnabled(true);
          setEpfEtf("");
          setAllowanceEnabled(false);
          setDeductionEnabled(false);
          setAllowances([{ type: "", amount: "" }]);
          setDeductions([{ type: "", amount: "" }]);
        }
      }
    }
  }, [isOpen, mode, initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^\+94\s?\d{9}$/;
  const employeePhoneRegex = /^(\+94\d{9}|0\d{9})$/;

  const validateField = (
    field: string,
    value: any,
    formMode: "company" | "employee",
  ) => {
    let error = "";
    if (formMode === "company") {
      switch (field) {
        case "name":
          if (!value || value.trim().length < 2)
            error = "Name must be at least 2 characters";
          break;
        case "email":
          if (!value) error = "Email is required";
          else if (!emailRegex.test(value)) error = "Invalid email format";
          break;
        case "contactNumber":
          if (!value) error = "Contact number is required";
          else if (!phoneRegex.test(value))
            error = "Must be +94 followed by 9 digits";
          break;
        case "address":
          if (!value || !value.trim()) error = "Address is required";
          break;
      }
    } else {
      switch (field) {
        case "fullName":
          if (!value || value.trim().length < 2)
            error = "Full name must be at least 2 characters";
          else if (/\d/.test(value)) error = "Full name cannot contain numbers";
          break;
        case "employeeId":
          if (!value || !value.trim()) error = "Employee ID is required";
          break;
        case "email":
          if (value && value.trim() && !emailRegex.test(value.trim()))
            error = "Invalid email format";
          break;
        case "contactNumber":
          if (!value) error = "Contact number is required";
          else if (!employeePhoneRegex.test(value))
            error = "Must be +94XXXXXXXXX or 0XXXXXXXXX (10 digits)";
          break;
        case "designation":
          if (value && /\d/.test(value))
            error = "Designation cannot contain numbers";
          break;
        case "basicSalary":
          if (
            value === undefined ||
            value === null ||
            value === "" ||
            isNaN(Number(value))
          )
            error = "Basic salary is required";
          else if (Number(value) < 0) error = "Basic salary cannot be negative";
          break;
        case "otRate":
          if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            isNaN(Number(value))
          )
            error = "OT rate must be a number";
          else if (Number(value) < 0) error = "OT rate cannot be negative";
          break;
        case "joinedDate":
          if (!value) error = "Joined date is required";
          else if (new Date(value) > new Date())
            error = "Joined date cannot be in the future";
          break;
        case "address":
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
      }
    }
    return error;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value =
      mode === "company"
        ? (companyData as any)[field]
        : (employeeData as any)[field];
    const error = validateField(field, value, mode);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCompanyChange = (
    field: keyof CreateCompanyRequest,
    value: string,
  ) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, "company");
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleEmployeeChange = (
    field: keyof CreateEmployeeRequest,
    value: any,
  ) => {
    setEmployeeData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, "employee");
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    if (mode === "company") {
      const requiredFields: (keyof CreateCompanyRequest)[] = [
        "name",
        "email",
        "address",
        "contactNumber",
      ];
      return requiredFields.every(
        (field) => !validateField(field, companyData[field], "company"),
      );
    } else {
      const requiredFields: (keyof CreateEmployeeRequest)[] = [
        "fullName",
        "employeeId",
        "contactNumber",
        "joinedDate",
      ];
      const bankFields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
      return (
        requiredFields.every(
          (field) =>
            !validateField(field, (employeeData as any)[field], "employee"),
        ) &&
        bankFields.every(
          (field) =>
            !validateField(field, (employeeData as any)[field], "employee"),
        ) &&
        (!employeeData.email ||
          !validateField("email", employeeData.email, "employee"))
      );
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (mode === "company") {
      const fields: (keyof CreateCompanyRequest)[] = [
        "name",
        "email",
        "contactNumber",
        "address",
      ];
      fields.forEach((f) => {
        const err = validateField(f, companyData[f], "company");
        if (err) newErrors[f] = err;
      });
    } else {
      const fields: (keyof CreateEmployeeRequest)[] = [
        "fullName",
        "employeeId",
        "contactNumber",
        "designation",
        "otRate",
        "joinedDate",
        "address",
        "email",
      ];
      fields.forEach((f) => {
        const err = validateField(f, (employeeData as any)[f], "employee");
        if (err) newErrors[f] = err;
      });

      // Bank detail fields
      const bankFields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
      bankFields.forEach((f) => {
        const err = validateField(f, (employeeData as any)[f], "employee");
        if (err) newErrors[f] = err;
      });
    }

    setErrors(newErrors);
    const allTouched: Record<string, boolean> = {};
    Object.keys(newErrors).forEach((k) => (allTouched[k] = true));
    if (mode === "company") {
      ["name", "email", "contactNumber", "address"].forEach(
        (f) => (allTouched[f] = true),
      );
    } else {
      [
        "fullName",
        "employeeId",
        "contactNumber",
        "designation",
        "otRate",
        "joinedDate",
        "address",
        "email",
        "bankName",
        "accountNumber",
        "branchName",
        "accountHolderName",
      ].forEach((f) => (allTouched[f] = true));
    }
    setTouched(allTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === "company") {
        await onSubmit(companyData);
      } else {
        if (!companyId && !initialData) {
          if (!companyId && !employeeData.companyId)
            throw new Error("Company ID is missing");
        }

        // Build recurring allowances array
        const recurringAllowances = allowanceEnabled
          ? allowances
            .filter(
              (a) =>
                a.type.trim() && a.amount.trim() && parseFloat(a.amount) > 0,
            )
            .map((a) => ({
              type: a.type.trim(),
              amount: parseFloat(a.amount),
            }))
          : [];

        // Build recurring deductions array
        const recurringDeductions = deductionEnabled
          ? deductions
            .filter(
              (d) =>
                d.type.trim() && d.amount.trim() && parseFloat(d.amount) > 0,
            )
            .map((d) => ({
              type: d.type.trim(),
              amount: parseFloat(d.amount),
            }))
          : [];

        const finalEmployeeData = {
          ...employeeData,
          email: employeeData.email?.trim() || "",
          designation: employeeData.designation?.trim() || "",
          address: employeeData.address?.trim() || "",
          companyId: companyId || employeeData.companyId,
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

  const isCompany = mode === "company";
  const isEdit = !!initialData;
  const title = isCompany
    ? isEdit
      ? "Edit Company"
      : "Add New Company"
    : isEdit
      ? "Edit Employee"
      : "Add New Employee";

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
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-5 pt-4 pb-0">
            <div className="flex justify-between">
              <h2 className="text-[20px] font-bold text-gray-900 mb-4">
                {title}
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                style={{ borderRadius: "50%" }}
                className={`w-6 h-6 flex items-center justify-center hover:bg-gray-100 border border-gray-300 transition-all duration-300 disabled:opacity-50 mb-2 ${isVisible ? "opacity-100" : "opacity-0"}`}
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {!isCompany && (
              <div className="flex gap-6 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("employee")}
                  className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === "employee" ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Employee Information
                  {activeTab === "employee" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("payment")}
                  className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === "payment" ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Payment Information
                  {activeTab === "payment" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bank")}
                  className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === "bank" ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Bank Details
                  {activeTab === "bank" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              {isCompany ? (
                /* COMPANY FORM */
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-[#367AFF] p-1.5 rounded">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Company Information
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companyData.name}
                          onChange={(e) =>
                            handleCompanyChange("name", e.target.value)
                          }
                          onBlur={() => handleBlur("name")}
                          placeholder="Enter company name"
                          className={`w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.name && errors.name ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                        />
                        {touched.name && errors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={companyData.address}
                          onChange={(e) =>
                            handleCompanyChange("address", e.target.value)
                          }
                          onBlur={() => handleBlur("address")}
                          placeholder="Enter company address"
                          className={`w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                        />
                        {touched.address && errors.address && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.address}
                          </p>
                        )}
                      </div>
                      {/* Email and Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={companyData.email}
                            onChange={(e) =>
                              handleCompanyChange("email", e.target.value)
                            }
                            onBlur={() => handleBlur("email")}
                            placeholder="company@example.com"
                            className={`w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                          />
                          {touched.email && errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={companyData.contactNumber}
                            onChange={(e) =>
                              handleCompanyChange(
                                "contactNumber",
                                e.target.value,
                              )
                            }
                            onBlur={() => handleBlur("contactNumber")}
                            placeholder="+94 77 123 0000"
                            className={`w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                          />
                          {touched.contactNumber && errors.contactNumber && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.contactNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPLOYEE FORM */
                <>
                  <div>
                    <div className="space-y-1.5">
                      {/* ===== Employee Information Tab ===== */}
                      {activeTab === "employee" && (
                        <div className="space-y-1.5">
                          {/* Employee ID */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Employee ID
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.employeeId}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "employeeId",
                                    e.target.value,
                                  )
                                }
                                onBlur={() => handleBlur("employeeId")}
                                placeholder="Enter employee ID"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.employeeId && errors.employeeId && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.employeeId}
                              </p>
                            )}
                          </div>

                          {/* Name */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.fullName}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "fullName",
                                    e.target.value,
                                  )
                                }
                                onBlur={() => handleBlur("fullName")}
                                placeholder="Enter employee name"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.fullName && errors.fullName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.fullName}
                              </p>
                            )}
                          </div>

                          {/* NIC */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              NIC
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.employeeNIC || ""}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "employeeNIC",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter employee NIC Number"
                                className="text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all border-gray-300 focus:ring-[#367AFF] focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* Address */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.address}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "address",
                                    e.target.value,
                                  )
                                }
                                onBlur={() => handleBlur("address")}
                                placeholder="Enter address"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.address && errors.address && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.address}
                              </p>
                            )}
                          </div>

                          {/* EPF Number */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              EPF Number
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Activity className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.epfNumber || ""}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "epfNumber",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter EPF Number"
                                className="text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all border-gray-300 focus:ring-[#367AFF] focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* Email & Phone */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                                Email (optional)
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="email"
                                  value={employeeData.email}
                                  onChange={(e) =>
                                    handleEmployeeChange(
                                      "email",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => handleBlur("email")}
                                  placeholder="employee@example.com"
                                  className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                />
                              </div>
                              {touched.email && errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.email}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                                Phone Number
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="tel"
                                  value={employeeData.contactNumber}
                                  onChange={(e) =>
                                    handleEmployeeChange(
                                      "contactNumber",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => handleBlur("contactNumber")}
                                  placeholder="0771234567"
                                  className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                                />
                              </div>
                              {touched.contactNumber &&
                                errors.contactNumber && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.contactNumber}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Designation */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Designation
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Award className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.designation}
                                onChange={(e) => {
                                  const filteredValue = e.target.value.replace(
                                    /[0-9]/g,
                                    "",
                                  );
                                  handleEmployeeChange(
                                    "designation",
                                    filteredValue,
                                  );
                                }}
                                onBlur={() => handleBlur("designation")}
                                placeholder="Enter employee designation"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.designation && errors.designation && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.designation}
                              </p>
                            )}
                          </div>

                          {/* Joined Date */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Joined Date
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="date"
                                value={employeeData.joinedDate}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "joinedDate",
                                    e.target.value,
                                  )
                                }
                                onBlur={() => handleBlur("joinedDate")}
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.joinedDate && errors.joinedDate ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.joinedDate && errors.joinedDate && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.joinedDate}
                              </p>
                            )}
                          </div>

                          {/* Add Files */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Add Files
                            </label>
                            <label
                              className="flex items-center gap-2 w-full px-3 py-1.5 border border-gray-300 rounded-lg cursor-pointer hover:border-[#367AFF] transition-colors text-[13px] text-gray-500"
                            >
                              <ListFilter className="h-4 w-4 text-gray-400" />
                              <span>Add Employee Files</span>
                              <PlusCircle className="h-4 w-4 text-gray-400 ml-auto" />
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    setEmployeeFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                  }
                                }}
                              />
                            </label>
                            {employeeFiles.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {employeeFiles.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg text-[12px] text-gray-600">
                                    <span className="truncate max-w-[80%]">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setEmployeeFiles(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Next Button */}
                          <button
                            type="button"
                            onClick={() => setActiveTab("payment")}
                            className="w-full text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] mt-2"
                          >
                            Next
                          </button>
                        </div>
                      )}

                      {/* ===== Payment Information Tab ===== */}
                      {activeTab === "payment" && (
                        <div className="space-y-1.5">
                          {/* ── Monthly Basic Section ── */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[14px] font-medium text-gray-700">
                                {employeeData.salaryType === "MONTHLY"
                                  ? "Monthly Basic"
                                  : "Daily Rate"}
                              </span>
                              <select
                                value={employeeData.salaryType || "DAILY"}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "salaryType",
                                    e.target.value as "DAILY" | "MONTHLY",
                                  )
                                }
                                className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-8"
                              >
                                <option value="MONTHLY">Monthly</option>
                                <option value="DAILY">Daily</option>
                              </select>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Globe className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={employeeData.basicSalary || ""}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "basicSalary",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                onBlur={() => handleBlur("basicSalary")}
                                placeholder={
                                  employeeData.salaryType === "MONTHLY"
                                    ? "Enter employee Monthly Basic"
                                    : "Enter daily rate"
                                }
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.basicSalary && errors.basicSalary ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.basicSalary && errors.basicSalary && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.basicSalary}
                              </p>
                            )}
                          </div>

                          {/* ── EPF/ETF Section ── */}
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Toggle
                                enabled={epfEnabled}
                                onToggle={() => setEpfEnabled(!epfEnabled)}
                              />
                              <span className="text-[14px] font-medium text-gray-700">
                                EPF/ETF
                              </span>
                            </div>
                            {epfEnabled && (
                              <div className="relative ml-0">
                                <input
                                  type="number"
                                  min="0"
                                  value={epfEtf}
                                  onChange={(e) => setEpfEtf(e.target.value)}
                                  placeholder="Enter EPF/ETF Amount"
                                  className="text-[13px] w-full px-4 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* ── OT Rate ── */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              OT Rate (Rs/hr)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={employeeData.otRate || ""}
                              onChange={(e) =>
                                handleEmployeeChange(
                                  "otRate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onBlur={() => handleBlur("otRate")}
                              placeholder="Enter OT Rate (Rs)"
                              className={`text-[13px] w-full px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.otRate && errors.otRate ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />
                            {touched.otRate && errors.otRate && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.otRate}
                              </p>
                            )}
                          </div>

                          {/* ── Allowances Section ── */}
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Toggle
                                enabled={allowanceEnabled}
                                onToggle={() =>
                                  setAllowanceEnabled(!allowanceEnabled)
                                }
                              />
                              <span className="text-[14px] font-medium text-gray-700">
                                Allowance
                              </span>
                            </div>

                            {allowanceEnabled && (
                              <div className="space-y-3">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_1fr_36px] gap-3">
                                  <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                                    Type
                                  </span>
                                  <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                                    Amount
                                  </span>
                                  <span></span>
                                </div>

                                {/* Existing allowance rows */}
                                {allowances.map((allowance, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center"
                                  >
                                    <input
                                      type="text"
                                      value={allowance.type}
                                      onChange={(e) => {
                                        const updated = [...allowances];
                                        updated[index].type = e.target.value;
                                        setAllowances(updated);
                                      }}
                                      placeholder="Travelling"
                                      className="text-[13px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all"
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
                                      placeholder="15,000.00"
                                      className="text-[13px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (allowances.length > 1) {
                                          setAllowances(
                                            allowances.filter(
                                              (_, i) => i !== index,
                                            ),
                                          );
                                        }
                                      }}
                                      className="flex items-center justify-center"
                                      disabled={allowances.length <= 1}
                                    >
                                      <MinusCircle
                                        className={`w-5 h-5 ${allowances.length <= 1 ? "text-gray-300" : "text-red-400 hover:text-red-600 cursor-pointer"} transition-colors`}
                                      />
                                    </button>
                                  </div>
                                ))}

                                {/* Add new allowance row */}
                                <div
                                  onClick={() =>
                                    setAllowances([
                                      ...allowances,
                                      { type: "", amount: "" },
                                    ])
                                  }
                                  className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                    <ListFilter className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors">
                                      Add Extra Allowances
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                    <span className="text-sm text-gray-400">
                                      Enter Amount
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <PlusCircle className="w-5 h-5 text-blue-400 group-hover:text-[#367AFF] transition-colors" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ── Deductions Section ── */}
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Toggle
                                enabled={deductionEnabled}
                                onToggle={() =>
                                  setDeductionEnabled(!deductionEnabled)
                                }
                              />
                              <span className="text-[14px] font-medium text-gray-700">
                                Recurring Deductions
                              </span>
                            </div>

                            {deductionEnabled && (
                              <div className="space-y-3">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_1fr_36px] gap-3">
                                  <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                                    Type
                                  </span>
                                  <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                                    Amount (Rs)
                                  </span>
                                  <span></span>
                                </div>

                                {/* Existing deduction rows */}
                                {deductions.map((deduction, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center"
                                  >
                                    <input
                                      type="text"
                                      value={deduction.type}
                                      onChange={(e) => {
                                        const updated = [...deductions];
                                        updated[index].type = e.target.value;
                                        setDeductions(updated);
                                      }}
                                      placeholder="Loan"
                                      className="text-[13px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all"
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
                                      className="text-[13px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (deductions.length > 1) {
                                          setDeductions(
                                            deductions.filter(
                                              (_, i) => i !== index,
                                            ),
                                          );
                                        }
                                      }}
                                      className="flex items-center justify-center"
                                      disabled={deductions.length <= 1}
                                    >
                                      <MinusCircle
                                        className={`w-5 h-5 ${deductions.length <= 1 ? "text-gray-300" : "text-red-400 hover:text-red-600 cursor-pointer"} transition-colors`}
                                      />
                                    </button>
                                  </div>
                                ))}

                                {/* Add new deduction row */}
                                <div
                                  onClick={() =>
                                    setDeductions([
                                      ...deductions,
                                      { type: "", amount: "" },
                                    ])
                                  }
                                  className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors">
                                    <ListFilter className="w-4 h-4 text-red-300 group-hover:text-red-500 transition-colors" />
                                    <span className="text-sm text-gray-400 group-hover:text-red-500 transition-colors">
                                      Add Deduction
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors">
                                    <span className="text-sm text-gray-400">
                                      Enter Amount
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <PlusCircle className="w-5 h-5 text-blue-400 group-hover:text-red-500 transition-colors" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ===== Bank Details Tab ===== */}
                      {activeTab === "bank" && (
                        <div className="space-y-1.5">
                          {/* ── Bank name ── */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Bank name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Landmark className="h-4 w-4 text-gray-400" />
                              </div>
                              <select
                                value={employeeData.bankName || ""}
                                onChange={(e) =>
                                  handleEmployeeChange("bankName", e.target.value)
                                }
                                onBlur={() => handleBlur("bankName")}
                                className={`text-[13px] w-full pl-10 pr-10 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] ${touched.bankName && errors.bankName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                              >
                                <option value="">Select Bank</option>
                                {SRI_LANKAN_BANKS.map((bank) => (
                                  <option key={bank} value={bank}>
                                    {bank}
                                  </option>
                                ))}

                              </select>
                            </div>
                            {touched.bankName && errors.bankName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.bankName}
                              </p>
                            )}
                          </div>

                          {/* ── Account number ── */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Account number
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Landmark className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.accountNumber || ""}
                                onChange={(e) =>
                                  handleEmployeeChange("accountNumber", e.target.value)
                                }
                                placeholder="Enter your account number"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountNumber && errors.accountNumber ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.accountNumber && errors.accountNumber && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.accountNumber}
                              </p>
                            )}
                          </div>

                          {/* ── Branch ── */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Branch
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Landmark className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.branchName || ""}
                                onChange={(e) =>
                                  handleEmployeeChange("branchName", e.target.value)
                                }
                                placeholder="Branch name"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.branchName && errors.branchName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.branchName && errors.branchName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.branchName}
                              </p>
                            )}
                          </div>

                          {/* ── Account holder name ── */}
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">
                              Account holder name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={employeeData.accountHolderName || ""}
                                onChange={(e) =>
                                  handleEmployeeChange("accountHolderName", e.target.value)
                                }
                                placeholder="Enter your account holder name"
                                className={`text-[13px] w-full pl-10 pr-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountHolderName && errors.accountHolderName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />
                            </div>
                            {touched.accountHolderName && errors.accountHolderName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.accountHolderName}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Inline Payment Tab Next Button */}
                      {activeTab === "payment" && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("bank")}
                          className="w-full text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] mt-2"
                        >
                          Next
                        </button>
                      )}

                      {/* Inline Bank Tab Finish Button */}
                      {activeTab === "bank" && (
                        <button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !isFormValid()}
                          className="w-full text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Saving..." : isEdit ? "Update" : "Finish"}
                        </button>
                      )}

                      {/* Hidden Fields */}
                      <input type="hidden" value={employeeData.department} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>

          {/* Footer - Only for Company mode */}
          {isCompany && (
            <div className="p-4 border-t border-gray-200 flex justify-center">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid()}
                className="w-2/3 max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Finish"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UniversalDrawer;
