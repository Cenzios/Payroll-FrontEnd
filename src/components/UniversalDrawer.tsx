import { useState, FormEvent, useEffect } from "react";
import { PlusCircle, MinusCircle, UploadCloud, Activity, MapPin, Phone, Mail, UserRound, Landmark, Home as HomeIcon, ListOrdered, CreditCard, Hotel, ListFilter, X, Award, Calendar, Banknote, Wallet } from "lucide-react";
import FileUploadModal from "./FileUploadModal";
import { CreateCompanyRequest } from "../types/company.types";
import { CreateEmployeeRequest } from "../types/employee.types";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface UniversalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, files?: File[], fileTitles?: Record<number, string>) => Promise<void>;
  mode: "company" | "employee";
  companyId?: string;
  initialData?: any; // For edit mode
}

const SRI_LANKAN_BANKS = [
  "Bank of Ceylon",
  "People’s Bank",
  "Commercial Bank of Ceylon",
  "Hatton National Bank (HNB)",
  "Sampath Bank",
  "Seylan Bank",
  "Nations Trust Bank (NTB)",
  "DFCC Bank",
  "National Development Bank (NDB)",
  "Pan Asia Banking Corporation (PABC)",
  "Union Bank of Colombo",
  "Amana Bank",
  "Cargills Bank",
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);
  const [employeeFileTitles, setEmployeeFileTitles] = useState<Record<number, string>>({});

  // Payment tab state
  const [epfEtf, setEpfEtf] = useState("");
  const [epfEnabled, setEpfEnabled] = useState(false);
  const [allowanceEnabled, setAllowanceEnabled] = useState(false);
  const [deductionEnabled, setDeductionEnabled] = useState(false);
  const [allowances, setAllowances] = useState<
    { type: string; amount: string }[]
  >([{ type: "", amount: "" }]);
  const [deductions, setDeductions] = useState<
    { type: string; amount: string }[]
  >([{ type: "", amount: "" }]);

  // Reset forms when drawer opens/closes or mode changes or initialData changes
  // Reset and load data effect
  useEffect(() => {
    if (isOpen) {
      setActiveTab("employee");
      setErrors({}); // Reset validation errors
      setTouched({}); // Reset touched fields

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

          // These will be overridden by the dedicated effect for recurring data
          // but we reset them here for safety
          setAllowanceEnabled(false);
          setDeductionEnabled(false);
          setAllowances([{ type: "", amount: "" }]);
          setDeductions([{ type: "", amount: "" }]);
        } else {
          // Check for draft in localStorage
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
            } catch (e) {
              console.error("Failed to parse draft", e);
            }
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
          setEmployeeFiles([]); // reset files
        }
      }
    }
  }, [isOpen, mode, initialData, companyId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;

      e.preventDefault();
      const container = e.currentTarget as HTMLElement;
      if (container) {
        const inputs = Array.from(
          container.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ) as HTMLElement[];
        const index = inputs.indexOf(target);
        if (index > -1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen && mode === "employee" && !initialData) {
      setEpfEnabled(false);
    }
  }, [isOpen, mode, initialData]);


  // Dedicated Effect for Recurring Data Population (Avoids race conditions)
  useEffect(() => {
    if (isOpen && mode === "employee" && initialData) {
      // 1. Auto-enable and Populate Allowances
      const internalAllowances = initialData.recurringAllowances || [];
      const hasAllowances = internalAllowances.length > 0;
      setAllowanceEnabled(!!initialData.allowanceEnabled || hasAllowances);

      if (hasAllowances) {
        setAllowances(
          internalAllowances.map((a: any) => ({
            type: a.type || "",
            amount: a.amount !== undefined ? a.amount.toString() : "",
          }))
        );
      } else {
        setAllowances([{ type: "", amount: "" }]);
      }

      // 2. Auto-enable and Populate Deductions
      const internalDeductions = initialData.recurringDeductions || [];
      const hasDeductions = internalDeductions.length > 0;
      setDeductionEnabled(!!initialData.deductionEnabled || hasDeductions);

      if (hasDeductions) {
        setDeductions(
          internalDeductions.map((d: any) => ({
            type: d.type || "",
            amount: d.amount !== undefined ? d.amount.toString() : "",
          }))
        );
      } else {
        setDeductions([{ type: "", amount: "" }]);
      }
    }
  }, [isOpen, mode, initialData]);

  // Save draft effect
  useEffect(() => {
    if (isOpen && mode === "employee" && !initialData && companyId) {
      const draftKey = `employee_add_draft_${companyId}`;
      const draftValues = {
        employeeData,
        epfEtf,
        epfEnabled,
        allowanceEnabled,
        deductionEnabled,
        allowances,
        deductions,
      };

      // Check if it's actually "dirty" before saving
      const isDirty =
        employeeData.fullName ||
        employeeData.employeeId ||
        employeeData.contactNumber ||
        employeeData.email ||
        (allowances.length > 1 || (allowances[0].type || allowances[0].amount)) ||
        (deductions.length > 1 || (deductions[0].type || deductions[0].amount));

      if (isDirty) {
        localStorage.setItem(draftKey, JSON.stringify(draftValues));
      } else {
        localStorage.removeItem(draftKey);
      }
    }
  }, [
    employeeData,
    epfEtf,
    epfEnabled,
    allowanceEnabled,
    deductionEnabled,
    allowances,
    deductions,
    mode,
    initialData,
    companyId,
    isOpen
  ]);

  const [isAccountNameEdited, setIsAccountNameEdited] = useState(false);
  useEffect(() => {
    if (employeeData.fullName && !isAccountNameEdited) {
      handleEmployeeChange("accountHolderName", employeeData.fullName);
    }
  }, [employeeData.fullName, isAccountNameEdited]);

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
          if (!value || value.trim().length < 3 || value.trim().length > 20)
            error = "Name must be between 3 and 20 characters";
          break;
        case "email": {
          const email = value?.trim();
          if (!value)
            error = "Email is required";
          else if (email.length > 100) {
            error = "Email must be less than 100 characters";
            break;
          }
          else if (value && value.trim() && !emailRegex.test(value.trim()))
            error = "Invalid email format";
          else if (email.includes("..")) {
            error = "Email cannot contain consecutive dots";
            break;
          }
          else if (email.startsWith(".") || email.endsWith(".")) {
            error = "Email cannot start or end with a dot";
            break;
          }
          else if (email.split("@")[1]?.startsWith("-") || email.split("@")[1]?.endsWith("-")) {
            error = "Invalid domain format";
            break;
          }
          break;
        }
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
          if (!value || value.trim().length < 3 || value.trim().length > 50)
            error = "Name must be between 3 and 50 characters";
          else if (/[^a-zA-Z\s.-]/.test(value))
            error = "Full name can only contain letters, spaces, dots, and hyphens";
          break;
        case "employeeId":
          if (!value || !value.trim()) error = "Employee ID is required";
          break;
        case "email": {
          const email = value?.trim();
          if (email.length > 100) {
            error = "Email must be less than 100 characters";
            break;
          }
          else if (value && value.trim() && !emailRegex.test(value.trim()))
            error = "Invalid email format";
          else if (email.includes("..")) {
            error = "Email cannot contain consecutive dots";
            break;
          }
          else if (email.startsWith(".") || email.endsWith(".")) {
            error = "Email cannot start or end with a dot";
            break;
          }
          else if (email.split("@")[1]?.startsWith("-") || email.split("@")[1]?.endsWith("-")) {
            error = "Invalid domain format";
            break;
          }
          break;
        }
        case "contactNumber":
          if (!value) error = "Contact number is required";
          else if (!employeePhoneRegex.test(value))
            error = "Must be +94XXXXXXXXX or 0XXXXXXXXX (10 digits)";
          break;
        case "designation":
          const designationRegex = /^[A-Za-z\s\-&.()\\\/]+$/;
          if (value && !designationRegex.test(value)) {
            error =
              "Designation can contain letters, spaces, /, \\, dots, hyphens, &, and parentheses";
          }
          break;
        case "basicSalary":
          if (
            value === undefined ||
            value === null ||
            value === "" ||
            isNaN(Number(value)) ||
            Number(value) === 0
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
        case "epfEtf":
          if (epfEnabled) {
            if (value === undefined || value === null || value === "") {
              error = "EPF/ETF amount is required";
            } else {
              const amount = Number(value);
              const basic = Number(employeeData.basicSalary) || 0;
              const limit = employeeData.salaryType === "MONTHLY" ? basic : basic * 20;
              if (amount > limit) {
                error = `Cannot exceed ${employeeData.salaryType === "MONTHLY" ? "monthly salary" : "20x daily rate"} (Rs. ${limit.toLocaleString()})`;
              }
            }
          }
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
          else if (!/^\d+$/.test(value.trim()))
            error = "Account number must contain only digits";
          else if (value.trim().length < 6)
            error = "Account number must be at least 6 digits";
          break;
        case "branchName":
          if (!value || !value.trim())
            error = "Branch name is required";
          // else if (/[^a-zA-Z\s.-]/.test(value))
          //   error = "Branch name can only contain letters, spaces, dots, and hyphens";
          break;
        case "accountHolderName":
          if (!value || value.trim().length < 2)
            error = "Account holder name must be at least 2 characters";
          else if (/[^a-zA-Z\s.-]/.test(value))
            error = "Account holder name can only contain letters, spaces, dots, and hyphens";
          break;
        case "employeeNIC":
          if (!value || !value.trim()) {
            error = "NIC is required";
          } else {
            const nic = value.trim();
            // Old NIC: 9 digits + V/X
            const oldNicRegex = /^\d{9}[vVxX]$/;
            // New NIC: 12 digits
            const newNicRegex = /^\d{12}$/;

            if (!oldNicRegex.test(nic) && !newNicRegex.test(nic)) {
              error = "Invalid NIC format (Old: 9 digits + V/X, New: 12 digits)";
            }
          }
          break;
        case "epfNumber":
          if (!value || !value.trim()) {
            error = "EPF Number is required";
          } else {
            const epf = value.trim();
            if (epf.length > 10) {
              error = "EPF Number cannot exceed 10 characters";
            } else if (/[^a-zA-Z0-9-]/.test(epf)) {
              error = "EPF Number can only contain letters, numbers, and dashes";
            }
          }
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

    // Re-validate EPF amount if basic salary or salary type changes
    if (field === "basicSalary" || field === "salaryType") {
      const epfError = validateField("epfEtf", epfEtf, "employee");
      setErrors((prev) => ({ ...prev, epfEtf: epfError }));
    }

    // Real-time validation: Mark as touched once the user starts typing
    if (value && String(value).trim() !== "") {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  const isTabValid = (tab: typeof activeTab) => {
    if (mode === "company") return true; // Company is single tab
    if (tab === "employee") {
      const fields: (keyof CreateEmployeeRequest)[] = [
        "fullName",
        "employeeId",
        "contactNumber",
        "joinedDate",
        "employeeNIC",
        "epfNumber",
      ];
      return fields.every(
        (field) =>
          !validateField(field, (employeeData as any)[field], "employee"),
      );
    }
    if (tab === "payment") {
      const basicError = validateField("basicSalary", employeeData.basicSalary, "employee");
      const epfError = epfEnabled ? validateField("epfEtf", epfEtf, "employee") : "";
      return !basicError && !epfError;
    }
    if (tab === "bank") {
      const fields = ["bankName", "accountNumber", "branchName", "accountHolderName"];
      return fields.every(
        (field) =>
          !validateField(field, (employeeData as any)[field], "employee"),
      );
    }
    return true;
  };

  const handleTabChange = (targetTab: typeof activeTab) => {
    if (mode === "company") {
      setActiveTab(targetTab);
      return;
    }

    // // Block Salary tab
    // if (targetTab === "payment" && !isTabValid("employee")) {
    //   setErrors({
    //     ...errors,
    //     form: "",
    //     //Please Complete Employee Information
    //   });
    //   return;
    // }

    // // Block Bank tab
    // if (targetTab === "bank") {
    //   if (!isTabValid("employee")) {
    //     setErrors({
    //       ...errors,
    //       form: "",
    //       //Please Complete Employee Information
    //     });
    //     return;
    //   }
    //   if (!isTabValid("payment")) {
    //     setErrors({
    //       ...errors,
    //       form: "",
    //       //Please Complete Salary Information
    //     });
    //     return;
    //   }
    // }

    setActiveTab(targetTab);
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
        "employeeNIC",
        "epfNumber",
      ];

      const bankFields = [
        "bankName",
        "accountNumber",
        "branchName",
        "accountHolderName",
      ];

      // Check ANY bank field is filled
      const isBankFilled = bankFields.some((f) => {
        const val = (employeeData as any)[f];
        return val && val.toString().trim() !== "";
      });

      // Validate bank ONLY if user started filling
      const isBankValid =
        !isBankFilled ||
        bankFields.every(
          (f) =>
            !validateField(f, (employeeData as any)[f], "employee"),
        );

      return (
        requiredFields.every(
          (field) =>
            !validateField(field, (employeeData as any)[field], "employee"),
        ) &&
        isBankValid &&
        (!employeeData.email ||
          !validateField("email", employeeData.email, "employee")) &&
        (!epfEnabled || !validateField("epfEtf", epfEtf, "employee"))
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
        "employeeNIC",
        "epfNumber",
      ];
      fields.forEach((f) => {
        const err = validateField(f, (employeeData as any)[f], "employee");
        if (err) newErrors[f] = err;
      });

      // Bank detail fields
      const bankFields = ["bankName", "accountNumber", "branchName", "accountHolderName"];

      const isBankFilled = bankFields.some((f) => {
        const val = (employeeData as any)[f];
        return val && val.toString().trim() !== "";
      });

      if (isBankFilled) {
        bankFields.forEach((f) => {
          const err = validateField(f, (employeeData as any)[f], "employee");
          if (err) newErrors[f] = err;
        });
      }

      // EPF validation
      const epfErr = epfEnabled ? validateField("epfEtf", epfEtf, "employee") : "";
      if (epfErr) newErrors.epfEtf = epfErr;
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
        "employeeNIC",
        "epfNumber",
        "bankName",
        "accountNumber",
        "branchName",
        "accountHolderName",
        "epfEtf",
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

        await onSubmit(finalEmployeeData, employeeFiles, employeeFileTitles);

        // Clear draft on success
        if (companyId) {
          localStorage.removeItem(`employee_add_draft_${companyId}`);
        }
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
        onKeyDown={handleKeyDown}
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
                  onClick={() => handleTabChange("employee")}
                  className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === "employee" ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Employee Information
                  {activeTab === "employee" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("payment")}
                  className={`pb-2 text-[13px] font-medium transition-colors relative ${activeTab === "payment" ? "text-[#367AFF]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Salary Information
                  {activeTab === "payment" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#367AFF] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("bank")}
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
                      <h3 className="font-semibold text-gray-900">
                        Company Information
                      </h3>
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
                          onChange={(e) =>
                            handleCompanyChange("name", e.target.value)
                          }
                          onBlur={() => handleBlur("name")}
                          placeholder="Enter company name"
                          className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.name && errors.name ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                        />

                        {touched.name && errors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                          </p>
                        )}
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
                          onChange={(e) =>
                            handleCompanyChange("address", e.target.value)
                          }
                          onBlur={() => handleBlur("address")}
                          placeholder="Enter company address"
                          className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
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
                            onChange={(e) =>
                              handleCompanyChange("email", e.target.value)
                            }
                            onBlur={() => handleBlur("email")}
                            placeholder="company@example.com"
                            className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                          />

                          {touched.email && errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.email}
                            </p>
                          )}
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
                            onChange={(e) =>
                              handleCompanyChange(
                                "contactNumber",
                                e.target.value,
                              )
                            }
                            onBlur={() => handleBlur("contactNumber")}
                            placeholder="+94 77 123 0000"
                            className={`text-[13px] w-full px-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {/* {errors.form && (
                            <div
                              onClick={() =>
                                setErrors((prev) => ({ ...prev, form: "" }))
                              }
                            // className="mb-3 text-red-600 text-sm"
                            >
                              {errors.form}
                            </div>
                          )} */}

                          {activeTab === "employee" ? "Employee Information" : activeTab === "payment" ? "Salary Information" : "Bank Details"}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {/* ===== Employee Information Tab ===== */}
                      {activeTab === "employee" && (
                        <div className="space-y-1.5">
                          {/* Employee ID */}
                          <div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Employee ID <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
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
                              placeholder="Enter Employee ID"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeId && errors.employeeId ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.employeeId && errors.employeeId && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.employeeId}
                              </p>
                            )}
                          </div>

                          {/* Name */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Name <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
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
                              placeholder="Enter Employee Name"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.fullName && errors.fullName ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.fullName && errors.fullName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.fullName}
                              </p>
                            )}
                          </div>

                          {/* NIC */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0  flex items-center pointer-events-none">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                NIC <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
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
                              onBlur={() => handleBlur("employeeNIC")}
                              placeholder="Enter Employee NIC Number"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.employeeNIC && errors.employeeNIC ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.employeeNIC && errors.employeeNIC && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.employeeNIC}
                              </p>
                            )}
                          </div>

                          {/* Address */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0  flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Address
                              </label>
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
                              placeholder="Enter Address"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.address && errors.address ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.address && errors.address && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.address}
                              </p>
                            )}
                          </div>

                          {/* EPF Number */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Activity className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                EPF Number <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
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
                              onBlur={() => handleBlur("epfNumber")}
                              placeholder="Enter EPF Number"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.epfNumber && errors.epfNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.epfNumber && errors.epfNumber && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.epfNumber}
                              </p>
                            )}
                          </div>

                          {/* Email & Phone */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="relative mt-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                  <Mail className="h-4 w-4 text-blue-500" />
                                </div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                  Email (optional)
                                </label>
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
                                className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.email && errors.email ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />

                              {touched.email && errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.email}
                                </p>
                              )}
                            </div>
                            <div>
                              <div className="relative mt-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                  <Phone className="h-4 w-4 text-blue-500" />
                                </div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                  Phone Number <strong className="text-red-600 text-[15px]">*</strong>
                                </label>
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
                                className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.contactNumber && errors.contactNumber ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                              />

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
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Award className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Designation
                              </label>
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
                              placeholder="Enter Employee Designation"
                              className={`text-[13px] w-full pl-3 pr-4 py-1.5 border rounded-lg focus:ring-2 outline-none transition-all ${touched.designation && errors.designation ? "border-red-500 focus:ring-red-100" : "border-gray-300 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.designation && errors.designation && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.designation}
                              </p>
                            )}
                          </div>

                          {/* Joined Date */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Joined Date <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
                            </div>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                value={employeeData.joinedDate ? dayjs(employeeData.joinedDate) : null}
                                onChange={(newValue) => {
                                  handleEmployeeChange(
                                    "joinedDate",
                                    newValue ? newValue.format('YYYY-MM-DD') : ""
                                  );
                                }}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    onBlur: () => handleBlur("joinedDate"),
                                    error: !!(touched.joinedDate && errors.joinedDate),
                                    sx: {
                                      width: "100%",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "0.5rem",
                                        "& fieldset": {
                                          borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                          borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#9ca3af",
                                        },
                                        "&.Mui-focused fieldset": {
                                          borderColor: (touched.joinedDate && errors.joinedDate) ? "#ef4444" : "#367AFF",
                                          borderWidth: "1px",
                                          boxShadow: (touched.joinedDate && errors.joinedDate) ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : "0 0 0 2px rgba(54, 122, 255, 0.2)",
                                        },
                                      },
                                      "& .MuiInputBase-input": {
                                        paddingY: "6px",
                                        paddingX: "12px",
                                        fontSize: "13px",
                                        color: "#374151",
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>

                            {touched.joinedDate && errors.joinedDate && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.joinedDate}
                              </p>
                            )}
                          </div>

                          {/* Add Files */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <UploadCloud className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Supporting Documents (Max 3)
                              </label>
                            </div>

                            {/* Show already uploaded count if editing */}
                            {initialData?.documents && initialData.documents.length > 0 && (
                              <div className="mb-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[13px] text-gray-500 font-medium">
                                  {initialData.documents.length} document(s) already uploaded
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setIsUploadModalOpen(true)}
                              disabled={((initialData?.documents?.length || 0) + employeeFiles.length) >= 3}
                              className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-[13px] text-gray-500 font-medium group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                            >
                              <span className="text-gray-400 text-[13px] font-light">
                                {((initialData?.documents?.length || 0) + employeeFiles.length) >= 3
                                  ? "Document limit reached"
                                  : "Upload Employee Documents"}
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
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFiles = employeeFiles.filter((_, i) => i !== idx);
                                        setEmployeeFiles(newFiles);

                                        // Re-index titles to match new file order
                                        const newTitles: Record<number, string> = {};
                                        let newIdx = 0;
                                        for (let i = 0; i < employeeFiles.length; i++) {
                                          if (i !== idx) {
                                            if (employeeFileTitles[i]) {
                                              newTitles[newIdx] = employeeFileTitles[i];
                                            }
                                            newIdx++;
                                          }
                                        }
                                        setEmployeeFileTitles(newTitles);
                                      }}
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
                            fileTitles={employeeFileTitles}
                            onTitlesChange={setEmployeeFileTitles}
                            maxFiles={3 - (initialData?.documents?.length || 0)}
                          />
                        </div>
                      )}

                      {/* ===== Salary Information Tab ===== */}
                      {activeTab === "payment" && (
                        <div className="space-y-1.5">
                          {/* ── Monthly Basic Section ── */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Wallet className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Basic Salary <strong className="text-red-600 text-[15px]">*</strong>
                              </label>
                            </div>


                            <div className="flex">
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
                                    ? "Enter Employee's Monthly Basic"
                                    : "Enter Employee's Daily Basic"
                                }
                                className={`text-[13px] w-full px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.otRate && errors.otRate ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}

                              />

                              <select
                                value={employeeData.salaryType || "DAILY"}
                                onChange={(e) =>
                                  handleEmployeeChange(
                                    "salaryType",
                                    e.target.value as "DAILY" | "MONTHLY",
                                  )
                                }
                                className="ml-2 px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none cursor-pointer"
                              >
                                <option value="MONTHLY">Monthly</option>
                                <option value="DAILY">Daily</option>
                              </select>
                            </div>

                            {touched.basicSalary && errors.basicSalary && (
                              <p className="text-red-500 text-[12px] mt-1">
                                {errors.basicSalary}
                              </p>
                            )}
                          </div>


                          {/* ── OT Rate ── */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Banknote className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                OT Rate (Rs/hr)
                              </label>
                            </div>

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

                          {/* ── EPF/ETF Section ── */}
                          <div>
                            <div className="flex items-center gap-3 mb-2 mt-4">
                              <Toggle
                                enabled={epfEnabled}
                                onToggle={() => {
                                  const newVal = !epfEnabled;
                                  setEpfEnabled(newVal);
                                  if (!newVal) {
                                    setErrors(prev => ({ ...prev, epfEtf: "" }));
                                  } else {
                                    const error = validateField("epfEtf", epfEtf, "employee");
                                    setErrors(prev => ({ ...prev, epfEtf: error }));
                                  }
                                }}
                              />
                              <span className="text-[13px] font-medium text-gray-700">
                                EPF/ETF
                              </span>

                              {epfEnabled && (
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    value={epfEtf}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEpfEtf(val);
                                      const error = validateField("epfEtf", val, "employee");
                                      setErrors(prev => ({ ...prev, epfEtf: error }));
                                    }}
                                    onBlur={() => {
                                      setTouched(prev => ({ ...prev, epfEtf: true }));
                                      const error = validateField("epfEtf", epfEtf, "employee");
                                      setErrors(prev => ({ ...prev, epfEtf: error }));
                                    }}
                                    placeholder="Enter Employee's EPF/ETF Applicable Amount"
                                    className={`text-[13px] w-[330px] px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${touched.epfEtf && errors.epfEtf ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                                  />
                                  {touched.epfEtf && errors.epfEtf && (
                                    <p className="text-red-500 text-[11px] absolute top-full mt-1 left-0 whitespace-nowrap">
                                      {errors.epfEtf}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── Allowances Section ── */}
                          <div>
                            <div className="flex items-center gap-3 mt-4 mb-2">
                              <Toggle
                                enabled={allowanceEnabled}
                                onToggle={() =>
                                  setAllowanceEnabled(!allowanceEnabled)
                                }
                              />
                              <span className="text-[13px] font-medium text-gray-700">
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
                                      className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all"
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
                                      className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#367AFF] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  onClick={() => {
                                    const last = allowances[allowances.length - 1];

                                    if (!last.type.trim() || !last.amount) {
                                      return;
                                    }

                                    setAllowances([
                                      ...allowances,
                                      { type: "", amount: "" },
                                    ]);
                                  }}
                                  className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                    <ListFilter className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-[12px] text-gray-400 group-hover:text-blue-500 transition-colors">
                                      Add Extra Allowances
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 border border-dashed border-gray-200 rounded-xl group-hover:border-blue-300 transition-colors">
                                    <span className="text-[12px] text-gray-400">
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
                            <div className="flex items-center gap-3 mt-4 mb-2">
                              <Toggle
                                enabled={deductionEnabled}
                                onToggle={() =>
                                  setDeductionEnabled(!deductionEnabled)
                                }
                              />
                              <span className="text-[13px] font-medium text-gray-700">
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
                                      className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all"
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
                                      className="text-[12px] w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  onClick={() => {
                                    const last = deductions[deductions.length - 1];

                                    if (!last.type.trim() || !last.amount) {
                                      return;
                                    }

                                    setDeductions([
                                      ...deductions,
                                      { type: "", amount: "" },
                                    ]);
                                  }}
                                  className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors">
                                    <ListFilter className="w-4 h-4 text-red-300 group-hover:text-red-500 transition-colors" />
                                    <span className="text-[12px] text-gray-400 group-hover:text-red-500 transition-colors">
                                      Add Deduction
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 border border-dashed border-red-200 rounded-xl group-hover:border-red-400 transition-colors">
                                    <span className="text-[12px] text-gray-400">
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
                          {/* ── Account holder name ── */}
                          <div>
                            <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <UserRound className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1  pl-6">
                                Account Holder Name
                              </label>
                            </div>

                            <input
                              type="text"
                              value={employeeData.accountHolderName ?? ""}
                              onChange={(e) => {
                                setIsAccountNameEdited(true);
                                handleEmployeeChange("accountHolderName", e.target.value);
                              }}
                              placeholder="Enter Your Account Holder Name"
                              className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountHolderName && errors.accountHolderName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.accountHolderName && errors.accountHolderName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.accountHolderName}
                              </p>
                            )}
                          </div>

                          {/* ── Bank name ── */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <Landmark className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Bank Name
                              </label>
                            </div>

                            <select
                              value={employeeData.bankName || ""}
                              onChange={(e) =>
                                handleEmployeeChange("bankName", e.target.value)
                              }
                              onBlur={() => handleBlur("bankName")}
                              className={`text-[13px] w-full pr-10 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] ${touched.bankName && errors.bankName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                            >
                              <option value="">Select Bank</option>
                              {SRI_LANKAN_BANKS.map((bank) => (
                                <option key={bank} value={bank}>
                                  {bank}
                                </option>
                              ))}

                            </select>

                            {touched.bankName && errors.bankName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.bankName}
                              </p>
                            )}
                          </div>

                          {/* ── Branch ── */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <HomeIcon className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1  pl-6">
                                Branch
                              </label>
                            </div>

                            <input
                              type="text"
                              value={employeeData.branchName || ""}
                              onChange={(e) =>
                                handleEmployeeChange("branchName", e.target.value)
                              }
                              placeholder="Branch Name"
                              className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.branchName && errors.branchName ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.branchName && errors.branchName && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.branchName}
                              </p>
                            )}
                          </div>

                          {/* ── Account number ── */}
                          <div>
                            <div className="relative mt-4">
                              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <ListOrdered className="h-4 w-4 text-blue-500" />
                              </div>
                              <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                                Account Number
                              </label>
                            </div>

                            <input
                              type="text"
                              value={employeeData.accountNumber || ""}
                              onChange={(e) =>
                                handleEmployeeChange("accountNumber", e.target.value)
                              }
                              placeholder="Enter Your Account Number"
                              className={`text-[13px] w-full pr-4 px-4 py-1.5 border rounded-xl focus:ring-2 outline-none transition-all ${touched.accountNumber && errors.accountNumber ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-[#367AFF] focus:border-transparent"}`}
                            />

                            {touched.accountNumber && errors.accountNumber && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.accountNumber}
                              </p>
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

          {/* Footer Section */}
          <div className="p-4 border-t border-gray-200 flex justify-center">
            {isCompany || activeTab === "bank" ? (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid()}
                className="w-full max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Finish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "employee") handleTabChange("payment");
                  else if (activeTab === "payment") handleTabChange("bank");
                }}
                disabled={!isTabValid(activeTab)}
                className="w-full max-w-sm text-white bg-[#367AFF] hover:bg-[#367AFF]/90 py-2.5 rounded-lg font-semibold transition-colors text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UniversalDrawer;
