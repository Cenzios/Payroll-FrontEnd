import { Calculator, Loader2 } from "lucide-react";
import { Employee } from "../types/employee.types";

interface EmployeeSalaryCardProps {
    emp: Employee;
    selectedEmployee: Employee | null;
    handleSelectEmployee: (emp: Employee) => void;
    workedDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    otHours: number;
    salaryAdvance: number;
    loanDeduction: number;
    handleEmployeeWorkedDaysChange: (empId: string, val: number) => void;
    handleEmployeeOtHoursChange: (empId: string, val: number) => void;
    handleEmployeeSalaryAdvanceChange: (empId: string, val: number) => void;
    handleToggleLoan: (empId: string) => void;
    handleToggleEpfEtf: (empId: string) => void;
    handleGeneratePayslip: (emp: Employee) => void;
    openManageModal: (type: "allowance" | "deduction", emp: Employee) => void;
    allowanceToggles: Record<string, boolean>;
    deductionToggles: Record<string, boolean>;
    setAllowanceToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setDeductionToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isSaving: boolean;
    hasAnyError: (emp: Employee) => boolean;
    setTouchedFields: React.Dispatch<React.SetStateAction<any>>;
}

const EmployeeSalaryCard = ({
    emp,
    selectedEmployee,
    handleSelectEmployee,
    workedDays,
    isEpfEnabled,
    isLoanEnabled,
    otHours,
    salaryAdvance,
    loanDeduction,
    handleEmployeeWorkedDaysChange,
    handleEmployeeOtHoursChange,
    handleEmployeeSalaryAdvanceChange,
    handleToggleLoan,
    handleToggleEpfEtf,
    handleGeneratePayslip,
    openManageModal,
    allowanceToggles,
    deductionToggles,
    setAllowanceToggles,
    setDeductionToggles,
    isSaving,
    hasAnyError,
    setTouchedFields,
}: EmployeeSalaryCardProps) => {
    return (
        <div
            onClick={() => handleSelectEmployee(emp)}
            className={`bg-white rounded-xl border px-3 py-2 cursor-pointer transition-all duration-200 ${selectedEmployee?.id === emp.id
                    ? "border-blue-500 shadow-md ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {emp.fullName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 leading-tight">
                            {emp.fullName}
                        </h3>
                        <p className="text-[11px] font-normal text-gray-500 leading-tight mt-0.5">
                            {emp.designation}
                        </p>
                    </div>
                </div>
                <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded">
                    {emp.employeeId}
                </div>
            </div>

            {/* Input Controls - Visible when selected */}
            {selectedEmployee?.id === emp.id && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Earnings */}
                    <div>
                        <h4 className="flex items-center gap-2 text-[14px] font-semibold mb-3">
                            <Calculator className="w-4 h-4  text-green-600" /> Earnings
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="text-[12px] text-gray-500 block mb-1">
                                    Rate ({emp.salaryType || "DAILY"})
                                </label>
                                <div className="text-[12px] font-semibold text-gray-900">
                                    Rs. {emp.basicSalary || 0}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">
                                    Enter Worked Days
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={workedDays}
                                    onChange={(e) =>
                                        handleEmployeeWorkedDaysChange(
                                            emp.id,
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    onBlur={() =>
                                        setTouchedFields((prev: any) => ({
                                            ...prev,
                                            employeeDays: {
                                                ...prev.employeeDays,
                                                [emp.id]: true,
                                            },
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[12px] font-semibold text-gray-900"
                                    min="0"
                                    max="31"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">
                                    OT Hours
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={otHours}
                                    onChange={(e) =>
                                        handleEmployeeOtHoursChange(
                                            emp.id,
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[12px] font-semibold text-gray-900"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">
                                    OT Rate
                                </label>
                                <div className="bg-gray-50 px-3 py-2 border border-gray-100 rounded-lg text-[12px] font-semibold text-gray-900 h-[36px] flex items-center">
                                    Rs. {emp.otRate || 0}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">
                                    OT Amount
                                </label>
                                <div className="bg-gray-50 px-3 py-2 border border-gray-100 rounded-lg text-[12px] font-bold text-blue-600 h-[36px] flex items-center">
                                    Rs.{" "}
                                    {(otHours * (emp.otRate || 0)).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1 text-blue-600">
                                    Salary Advance Deductions
                                </label>
                                <input
                                    type="number"
                                    value={salaryAdvance}
                                    onChange={(e) =>
                                        handleEmployeeSalaryAdvanceChange(
                                            emp.id,
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-[12px] font-semibold text-gray-900"
                                    min="0"
                                />
                            </div>
                            {/* Loan Installment — matches EPF/ETF row layout exactly */}
                            <div className="col-span-2 flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleLoan(emp.id);
                                    }}
                                    className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0
            ${isLoanEnabled ? "bg-blue-500" : "bg-gray-300"}
        `}
                                >
                                    <span
                                        className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
                ${isLoanEnabled ? "translate-x-6" : "translate-x-1"}
            `}
                                    />
                                </button>
                                <span className="text-[14px] font-medium text-gray-800 whitespace-nowrap">
                                    Loan installment
                                </span>
                                <div
                                    className={`flex-1 px-4 py-2 border rounded-lg text-[12px] font-semibold transition-opacity ${isLoanEnabled
                                            ? "bg-blue-50 border-blue-200 text-blue-600"
                                            : "bg-gray-50 border-gray-200 text-gray-400 opacity-40 line-through"
                                        }`}
                                >
                                    Rs.{" "}
                                    {loanDeduction.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-4">
                        {/* EPF/ETF Row */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleToggleEpfEtf(emp.id)}
                                className={`
                                                              relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0
                                                              ${isEpfEnabled ? "bg-blue-500" : "bg-gray-300"}
                                                          `}
                            >
                                <span
                                    className={`
                                                                  inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
                                                                  ${isEpfEnabled ? "translate-x-6" : "translate-x-1"}
                                                              `}
                                />
                            </button>
                            <span className="text-[14px] font-medium text-gray-800 whitespace-nowrap">
                                EPF/ETF
                            </span>
                            <input
                                type="text"
                                value={isEpfEnabled ? emp.epfEtfAmount || "" : ""}
                                readOnly
                                placeholder="Total for EPF"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-600 bg-white outline-none focus:border-blue-300 transition-colors"
                            />
                        </div>

                        {/* Allowance Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAllowanceToggles((prev) => ({
                                            ...prev,
                                            [emp.id]: !prev[emp.id],
                                        }));
                                    }}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${allowanceToggles[emp.id] ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${allowanceToggles[emp.id] ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                                <span className="text-[14px] font-medium text-gray-800">
                                    Allowance
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (allowanceToggles[emp.id]) openManageModal("allowance", emp);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-[13px] font-medium transition-colors ${allowanceToggles[emp.id]
                                        ? "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M3 5h14M3 10h14M3 15h14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="7" cy="5" r="1.5" fill="currentColor" />
                                    <circle cx="13" cy="10" r="1.5" fill="currentColor" />
                                    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
                                </svg>
                                Manage Allowances
                            </button>
                        </div>

                        {/* Deduction Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeductionToggles((prev) => ({
                                            ...prev,
                                            [emp.id]: !prev[emp.id],
                                        }));
                                    }}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${deductionToggles[emp.id] ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${deductionToggles[emp.id] ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                                <span className="text-[14px] font-medium text-gray-800">
                                    Deduction
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (deductionToggles[emp.id]) openManageModal("deduction", emp);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-[13px] font-medium transition-colors ${deductionToggles[emp.id]
                                        ? "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M3 5h14M3 10h14M3 15h14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="7" cy="5" r="1.5" fill="currentColor" />
                                    <circle cx="13" cy="10" r="1.5" fill="currentColor" />
                                    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
                                </svg>
                                Manage Deductions
                            </button>
                        </div>
                    </div>

                    {/* Generate Pay-slip Button */}
                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGeneratePayslip(emp);
                            }}
                            disabled={isSaving || hasAnyError(emp)}
                            className={`px-5 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-200 shadow-sm flex items-center gap-2 ${isSaving || hasAnyError(emp)
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Generate Pay-slip"
                            )}
                        </button>
                    </div>
                </div>
            )}
            {selectedEmployee?.id !== emp.id && (
                <div className="mt-4 text-center text-sm text-gray-400 italic">
                    Click to calculate salary
                </div>
            )}
        </div>
    );
};

export default EmployeeSalaryCard;
