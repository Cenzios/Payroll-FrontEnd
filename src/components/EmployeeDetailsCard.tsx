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
    Trash2,
    Plus,
} from "lucide-react";
import { Employee } from "../types/employee.types";

interface EmployeeDetailsCardProps {
    selectedEmployee: Employee | null;
    setPreviewImage: (url: string | null) => void;
    onAddFileClick?: () => void;
    onDeleteFileClick?: (documentId: string, fileName: string) => void;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
    selectedEmployee,
    setPreviewImage,
    onAddFileClick,
    onDeleteFileClick,
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
                    <div className="w-[60px] h-[60px] rounded-full bg-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {selectedEmployee?.avatar ? (
                            <img
                                src={selectedEmployee.avatar}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-blue-700">
                                {selectedEmployee.fullName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-0.5">
                            {selectedEmployee.fullName}
                        </h2>
                        <p className="text-[13px] text-gray-500 font-medium tracking-wide">
                            {selectedEmployee.employeeId}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b-[2px] border-gray-100 mb-4 mt-1 shrink-0">
                    {["Personal Information", "Earnings & Deductions", "Bank Details"].map(
                        (tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 text-[13px] font-semibold transition-colors relative -mb-[2px] ${activeTab === tab
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
                        <div className="space-y-3">
                            {/* Name */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <User className="w-[14px] h-[14px]" />
                                    <span>Name</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.fullName}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <Mail className="w-[14px] h-[14px]" />
                                    <span>Email</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.email || "N/A"}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <MapPin className="w-[14px] h-[14px]" />
                                    <span>Address</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800 max-w-[280px] break-words">
                                    {selectedEmployee.address || "N/A"}
                                </div>
                            </div>

                            {/* Designation */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <Briefcase className="w-[14px] h-[14px]" />
                                    <span>Designation</span>
                                </div>
                                <div className="text-[13px] font-normal text-[#4A7DFF]">
                                    {selectedEmployee.designation || "None"}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <Flag className="w-[14px] h-[14px]" />
                                    <span>Status</span>
                                </div>
                                <div
                                    className={`text-[12px] font-medium px-[14px] py-[3px] rounded-[6px] ${selectedEmployee.status === "INACTIVE"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-[#D9EEDA] text-[#55AC73]"
                                        }`}
                                >
                                    {selectedEmployee.status === "INACTIVE" ? "Inactive" : "Active"}
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <Phone className="w-[14px] h-[14px]" />
                                    <span>Phone Number</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.contactNumber || "N/A"}
                                </div>
                            </div>

                            {/* Joining Date */}
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <Calendar className="w-[14px] h-[14px]" />
                                    <span>Joining Date</span>
                                </div>
                                <div className="text-[13px] font-normal text-gray-800 uppercase">
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
                            <div className="flex items-center">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-medium text-[#AAAEBF]">
                                    <DollarSign className="w-[14px] h-[14px]" />
                                    <span>
                                        {selectedEmployee.salaryType === "MONTHLY"
                                            ? "Monthly Rate"
                                            : "Daily Rate"}
                                    </span>
                                </div>
                                <div className="text-[13px] font-normal text-gray-800">
                                    {(selectedEmployee.basicSalary ?? 0).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>

                            {/* ── FILES SECTION (new design) ── */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                {/* Files header row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-[#AAAEBF]">
                                        <FileText className="w-[15px] h-[15px]" />
                                        <span className="text-[12px] font-semibold">Files</span>
                                    </div>
                                    {/* Add file button */}
                                    <button
                                        onClick={onAddFileClick}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                        <Plus className="w-3.5 h-3.5" />
                                        Add file
                                    </button>
                                </div>

                                {/* File list */}
                                <div className="space-y-2">
                                    {selectedEmployee.documents &&
                                        selectedEmployee.documents.filter(
                                            (doc) => !doc.documentType || doc.documentType === "EMPLOYEE",
                                        ).length > 0 ? (
                                        selectedEmployee.documents
                                            .filter(
                                                (doc) =>
                                                    !doc.documentType || doc.documentType === "EMPLOYEE",
                                            )
                                            .map((doc) => {
                                                const isPdf = doc.fileType === "application/pdf";
                                                return (
                                                    <div
                                                        key={doc.id}
                                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/30 transition-all group cursor-pointer"
                                                        onClick={() => {
                                                            if (isPdf) {
                                                                window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                                                            } else {
                                                                setPreviewImage(doc.fileUrl);
                                                            }
                                                        }}
                                                    >
                                                        {/* Left: badge + filename */}
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`text-[11px] font-bold px-2 py-1 rounded-md ${isPdf
                                                                    ? "bg-red-100 text-red-500"
                                                                    : "bg-blue-100 text-blue-500"
                                                                    }`}
                                                            >
                                                                {isPdf ? "PDF" : "PNG"}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-medium text-gray-800 line-clamp-1">
                                                                    {doc.docTitle || doc.fileName}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Right: delete button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onDeleteFileClick) {
                                                                    onDeleteFileClick(doc.id, doc.fileName);
                                                                }
                                                            }}
                                                            className="text-blue-400 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-[12px] text-gray-400 py-2">
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
                                            Allowances (Rs)
                                        </span>
                                    </div>

                                </div>
                                <div className="space-y-2">
                                    {selectedEmployee.recurringAllowances &&
                                        selectedEmployee.recurringAllowances.length > 0 ? (
                                        selectedEmployee.recurringAllowances.map((allowance, index) => (
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
                                        ))
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
                                            Deductions (Rs)
                                        </span>
                                    </div>

                                </div>
                                <div className="space-y-2">
                                    {selectedEmployee.recurringDeductions &&
                                        selectedEmployee.recurringDeductions.length > 0 ? (
                                        selectedEmployee.recurringDeductions.map((deduction, index) => (
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
                                        ))
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
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <Home className="w-[16px] h-[16px]" />
                                    <span>Bank name</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.bankName || "Bank of Ceylon"}
                                </div>
                            </div>
                            <div className="flex items-center pt-1">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <ListOrdered className="w-[16px] h-[16px]" />
                                    <span>Account number</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.accountNumber || "5585154"}
                                </div>
                            </div>
                            <div className="flex items-center pt-1">
                                <div className="w-[150px] flex items-center gap-2 text-[12px] font-semibold text-[#8B98A8]">
                                    <UsersIcon className="w-[16px] h-[16px]" />
                                    <span>Account name</span>
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                    {selectedEmployee.accountHolderName || selectedEmployee.fullName}
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