import React, { useState } from "react";
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    Flag,
    Phone,
    Calendar,
    DollarSign,
    FileText,
    PlusCircle,
    MinusCircle,
    Home,
    ListOrdered,
    Users as UsersIcon,
} from "lucide-react";
import { Employee } from "../types/employee.types";

interface EmployeeDetailsCardProps {
    selectedEmployee: Employee | null;
    setPreviewImage: (url: string | null) => void;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
    selectedEmployee,
    setPreviewImage,
}) => {
    const [activeTab, setActiveTab] = useState("Personal Information");

    if (!selectedEmployee) {
        return (
            <div className="flex-1 bg-[#FBFBFF] rounded-2xl shadow-sm border border-[#E4E4E7] p-6 h-full overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select an employee to view details</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#FBFBFF] rounded-2xl shadow-sm border border-[#E4E4E7] p-6 h-full overflow-hidden">
            <div className="max-w-2xl h-full flex flex-col">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-4 shrink-0">
                    <div className="w-[60px] h-[60px] rounded-[16px] bg-[#F1F6FA] flex flex-col overflow-hidden relative items-center justify-end shrink-0">
                        {selectedEmployee?.avatar ? (
                            <img
                                src={selectedEmployee.avatar}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#F1F6FA] text-2xl font-semibold text-[#324564]">
                                {selectedEmployee.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-[15px] font-medium text-gray-800 leading-tight mb-0.5">
                            {selectedEmployee.fullName}
                        </h2>
                        <p className="text-[12px] text-gray-500 font-medium tracking-wide">
                            {selectedEmployee.employeeId}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b-[2px] border-gray-100 mb-3 mt-1 shrink-0">
                    {["Personal Information", "Earnings & Deductions", "Bank Details"].map(
                        (tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 text-[12px] font-semibold transition-colors relative -mb-[2px] ${activeTab === tab
                                        ? "text-[#4A7DFF]"
                                        : "text-[#8392A5] hover:text-gray-600"
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4A7DFF]" />
                                )}
                            </button>
                        ),
                    )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-1 pb-1">
                    {activeTab === "Personal Information" && (
                        <div className="space-y-2">
                            {/* Name */}
                            <div className="flex items-center">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <User className="w-[14px] h-[14px]" />
                                    <span>Name</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700">
                                    {selectedEmployee.fullName}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <Mail className="w-[14px] h-[14px]" />
                                    <span>Email</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700">
                                    {selectedEmployee.email || "N/A"}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-center">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <MapPin className="w-[14px] h-[14px]" />
                                    <span>Address</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700 max-w-[280px] break-words">
                                    {selectedEmployee.address || "N/A"}
                                </div>
                            </div>

                            {/* Designation */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <Briefcase className="w-[14px] h-[14px]" />
                                    <span>Designation</span>
                                </div>
                                <div className="text-[11px] font-medium text-[#4A7DFF] bg-transparent border border-[#9CBDFF] px-[10px] py-[2px] rounded-[4px]">
                                    {selectedEmployee.designation || "None"}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <Flag className="w-[14px] h-[14px]" />
                                    <span>Status</span>
                                </div>
                                <div
                                    className={`text-[11px] font-semibold px-[12px] py-[2px] rounded-[4px] ${selectedEmployee.status === "INACTIVE"
                                            ? "bg-red-100/50 text-red-600"
                                            : "bg-[#D9EEDA] text-[#55AC73]"
                                        }`}
                                >
                                    {selectedEmployee.status === "INACTIVE"
                                        ? "Inactive"
                                        : "Active"}
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <Phone className="w-[14px] h-[14px]" />
                                    <span>Phone Number</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700">
                                    {selectedEmployee.contactNumber || "N/A"}
                                </div>
                            </div>

                            {/* Address 2 (duplicate in original code) */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <MapPin className="w-[14px] h-[14px]" />
                                    <span>Address</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700 max-w-[280px] break-words">
                                    {selectedEmployee.address || "N/A"}
                                </div>
                            </div>

                            {/* Joining Date */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <Calendar className="w-[14px] h-[14px]" />
                                    <span>Joining Date</span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700 uppercase">
                                    {selectedEmployee.joinedDate
                                        ? new Date(selectedEmployee.joinedDate)
                                            .toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })
                                            .replace(",", "")
                                        : "N/A"}
                                </div>
                            </div>

                            {/* Salary Rate */}
                            <div className="flex items-center pt-0.5">
                                <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                                    <DollarSign className="w-[14px] h-[14px]" />
                                    <span>
                                        {selectedEmployee.salaryType === "MONTHLY"
                                            ? "Monthly Rate"
                                            : "Daily Rate"}
                                    </span>
                                </div>
                                <div className="text-[12px] font-medium text-gray-700">
                                    {(selectedEmployee.basicSalary ?? 0).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>

                            {/* Files Placeholder */}
                            <div className="mt-4 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-[#AAAEBF] font-medium text-[11px] mb-3">
                                    <FileText className="w-[14px] h-[14px]" />
                                    <span>Files</span>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {selectedEmployee.documents &&
                                        selectedEmployee.documents.filter(
                                            (doc) => !doc.documentType || doc.documentType === "EMPLOYEE",
                                        ).length > 0 ? (
                                        selectedEmployee.documents
                                            .filter(
                                                (doc) =>
                                                    !doc.documentType || doc.documentType === "EMPLOYEE",
                                            )
                                            .map((doc) => (
                                                <button
                                                    key={doc.id}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (doc.fileType === "application/pdf") {
                                                            window.open(
                                                                doc.fileUrl,
                                                                "_blank",
                                                                "noopener,noreferrer",
                                                            );
                                                        } else {
                                                            setPreviewImage(doc.fileUrl);
                                                        }
                                                    }}
                                                    title={doc.fileName}
                                                    className="w-[74px] h-[74px] overflow-hidden border-[1.5px] border-[#E8ECEF] rounded-[10px] flex items-center justify-center bg-white hover:bg-[#F1F6FF] hover:border-[#9CBDFF] cursor-pointer transition-colors group relative"
                                                >
                                                    {doc.fileType.startsWith("image/") ? (
                                                        <img
                                                            src={doc.fileUrl}
                                                            alt={doc.fileName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <FileText className="w-[32px] h-[32px] text-[#AAAEBF] group-hover:text-[#4A7DFF] transition-colors" />
                                                    )}
                                                </button>
                                            ))
                                    ) : (
                                        <div className="text-[12px] text-gray-400">
                                            No documents found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Earnings & Deductions" && (
                        <div className="space-y-5 pt-2 pb-2">
                            {/* Allowances Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle className="w-[16px] h-[16px] text-[#8B98A8]" />
                                        <span className="text-[12px] font-semibold text-[#8B98A8]">
                                            Allowances
                                        </span>
                                    </div>
                                    <span className="text-[12px] font-semibold text-[#8B98A8] mr-2">
                                        Rs
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {selectedEmployee.recurringAllowances &&
                                        selectedEmployee.recurringAllowances.length > 0 ? (
                                        selectedEmployee.recurringAllowances.map(
                                            (allowance, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between pl-[28px] text-[12px] font-medium text-gray-800 pr-2"
                                                >
                                                    <span>{allowance.type}</span>
                                                    <span>
                                                        {allowance.amount.toLocaleString("en-US", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="pl-[28px] text-[12px] text-gray-400">
                                            No allowances found
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MinusCircle className="w-[16px] h-[16px] text-[#8B98A8]" />
                                        <span className="text-[12px] font-semibold text-[#8B98A8]">
                                            Deductions
                                        </span>
                                    </div>
                                    <span className="text-[12px] font-semibold text-[#8B98A8] mr-2">
                                        Rs
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {selectedEmployee.recurringDeductions &&
                                        selectedEmployee.recurringDeductions.length > 0 ? (
                                        selectedEmployee.recurringDeductions.map(
                                            (deduction, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between pl-[28px] text-[12px] font-medium text-gray-800 pr-2"
                                                >
                                                    <span>{deduction.type}</span>
                                                    <span>
                                                        {deduction.amount.toLocaleString("en-US", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="pl-[28px] text-[12px] text-gray-400">
                                            No deductions found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Bank Details" && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center">
                                <div className="w-[140px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <Home className="w-[16px] h-[16px]" />
                                    <span>Bank name</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.bankName || "Bank of ceylon"}
                                </div>
                            </div>
                            <div className="flex items-center pt-1">
                                <div className="w-[140px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <ListOrdered className="w-[16px] h-[16px]" />
                                    <span>Account number</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.accountNumber || "5585154"}
                                </div>
                            </div>
                            <div className="flex items-center pt-1">
                                <div className="w-[140px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <UsersIcon className="w-[16px] h-[16px]" />
                                    <span>Account name</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.accountHolderName ||
                                        selectedEmployee.fullName}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsCard;
