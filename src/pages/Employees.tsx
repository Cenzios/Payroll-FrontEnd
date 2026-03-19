import { useState, useEffect } from "react";
import {
  Plus,
  PlusCircle,
  MinusCircle,
  Home,
  ListOrdered,
  Users,
  Search,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Edit,
  Trash2,
  Ban,
  Landmark,
  Flag,
  FileText,
  FileImage,
  CreditCard,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import UniversalDrawer from "../components/UniversalDrawer";
import SuccessModal from "../components/SuccessModal";
import ConfirmationModal from "../components/ConfirmationModal"; // Import ConfirmationModal
import AddonModal from "../components/AddonModal"; // Import AddonModal
import { useAppSelector } from "../store/hooks";
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useUploadEmployeeDocumentMutation,
} from "../store/apiSlice";
import { Employee } from '../types/employee.types';
import PageHeader from '../components/PageHeader';
import Toast from "../components/Toast";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import PortalDropdown from "../components/PortalDropdown";

const Employees = () => {
  const { selectedCompanyId } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Personal Information");

  // RTK Query
  const { data, isLoading, isError, error } = useGetEmployeesQuery(
    {
      companyId: selectedCompanyId || "",
      page: 1,
      limit: 100,
      search,
    },
    {
      skip: !selectedCompanyId,
    },
  );

  const employees = data?.employees || [];

  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [uploadEmployeeDocument] = useUploadEmployeeDocumentMutation();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // Kebab Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    type: "danger" | "warning" | "info";
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Edit State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Select first employee default logic
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0]);
    }
  }, [employees, selectedEmployee]);

  // Error handling
  useEffect(() => {
    if (isError && error) {
      const err = error as any;
      setToast({
        message: err?.data?.message || "Failed to fetch employees",
        type: "error",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0]);
    }
  }, [employees, selectedEmployee]);

  // Sync menu anchor with activeMenuId
  useEffect(() => {
    if (!activeMenuId) {
      setMenuAnchor(null);
    }
  }, [activeMenuId]);

  const handleOpenLimitModal = () => {
    setConfirmation({
      isOpen: true,
      type: "warning",
      title: "Employee Limit Reached",
      message:
        "You’ve reached the maximum number of Employees allowed on your current plan. To add more Employees, please upgrade your plan.",
      confirmText: "Update Plan", // Reverted to Update Plan as per user request to not change UI
      onConfirm: () => {
        setIsAddonModalOpen(true);
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDrawerSubmit = async (data: any, files?: File[]) => {
    try {
      let savedEmployee;
      if (editingEmployee) {
        if (!selectedCompanyId) throw new Error("No company selected");
        savedEmployee = await updateEmployee({
          id: editingEmployee.id,
          companyId: selectedCompanyId,
          data,
        }).unwrap();
      } else {
        savedEmployee = await createEmployee(data).unwrap();
      }

      if (files && files.length > 0 && selectedCompanyId) {
        setToast({ message: "Uploading documents...", type: "success" });
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("employeeId", savedEmployee.id);
          await uploadEmployeeDocument(formData).unwrap();
        }
      }

      setIsDrawerOpen(false);
      setEditingEmployee(null); // Reset edit state
      setModalMessage(
        editingEmployee
          ? "The employee has been successfully updated."
          : "The employee has been successfully saved.",
      );
      setShowSuccessModal(true);
      // Cache invalidation handles refresh
    } catch (error: any) {
      if (error.message && error.message.includes("limit reached")) {
        handleOpenLimitModal();
      } else {
        setToast({
          message: error.message || "Operation failed",
          type: "error",
        });
      }
      throw error;
    }
  };

  const closeMenu = () => {
    setActiveMenuId(null);
    setMenuAnchor(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDrawerOpen(true);
    closeMenu();
  };

  const handleDeactivate = (employee: Employee) => {
    closeMenu();
    setConfirmation({
      isOpen: true,
      type: "warning",
      title: "Deactivate Employee?",
      message: `Are you sure you want to deactivate ${employee.fullName}? They will not be able to log in.`,
      onConfirm: async () => {
        try {
          if (!selectedCompanyId) return;
          await updateEmployee({
            id: employee.id,
            companyId: selectedCompanyId,
            data: { status: "INACTIVE" } as any,
          }).unwrap();
          setToast({
            message: "Employee deactivated successfully",
            type: "success",
          });
          // Cache refresh
        } catch (error: any) {
          setToast({
            message: error.message || "Failed to deactivate",
            type: "error",
          });
        } finally {
          setConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRemove = (employee: Employee) => {
    closeMenu();
    setConfirmation({
      isOpen: true,
      type: "danger",
      title: "Remove Employee?",
      message: `Are you sure you want to permanently remove ${employee.fullName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          if (!selectedCompanyId) {
            setToast({ message: "Company ID is missing", type: "error" });
            return;
          }
          await deleteEmployee({
            id: employee.id,
            companyId: selectedCompanyId,
          }).unwrap();
          setToast({
            message: "Employee removed successfully",
            type: "success",
          });
          // Provide feedback - maybe navigate away if selected?
          if (selectedEmployee?.id === employee.id) setSelectedEmployee(null);
          // Cache refresh
        } catch (error: any) {
          setToast({
            message: error.message || "Failed to remove",
            type: "error",
          });
        } finally {
          setConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleActivate = (employee: Employee) => {
    closeMenu();
    setConfirmation({
      isOpen: true,
      type: "info",
      title: "Activate Employee?",
      message: `Are you sure you want to activate ${employee.fullName}? They will be able to log in.`,
      onConfirm: async () => {
        try {
          if (!selectedCompanyId) return;
          await updateEmployee({
            id: employee.id,
            companyId: selectedCompanyId,
            data: { status: "ACTIVE" } as any,
          }).unwrap();
          setToast({
            message: "Employee activated successfully",
            type: "success",
          });
          // Cache refresh
        } catch (error: any) {
          setToast({
            message: error.message || "Failed to activate",
            type: "error",
          });
        } finally {
          setConfirmation((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Helper for adding new
  const openAddDrawer = () => {
    setEditingEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    employeeId: string,
  ) => {
    event.stopPropagation();
    if (activeMenuId === employeeId) {
      closeMenu();
    } else {
      setMenuAnchor(event.currentTarget);
      setActiveMenuId(employeeId);
    }
  };

  const activeMenuEmployee = employees.find((e) => e.id === activeMenuId);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-64 p-6 h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0">
          <PageHeader
            title="Employees"
            subtitle="Here's your Employees overview"
            actionElement={
              <button
                onClick={() => {
                  if (!selectedCompanyId) {
                    setToast({
                      message: "Please select a company from the Dashboard first.",
                      type: "error",
                    });
                    return;
                  }
                  openAddDrawer();
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                title={!selectedCompanyId ? "Please select a company from the Dashboard first" : ""}
              >
                Add Employee
                <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center ml-1">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            }
          />
        </div>

        {/* Table Container */}  {/* Main Content */}
        {!selectedCompanyId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Company Selected
              </h3>
              <p className="text-gray-500">
                Please go to the Dashboard and select a company to view
                employees.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 flex-1 overflow-hidden pb-4">
            {/* Left Column - Employee List */}
            <div className="w-[60%] flex flex-col pr-6 h-full">
              {/* Search */}
              <div className="pb-6 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users by name"
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#F2F4FF] focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="py-4">
                    <TableSkeleton rows={5} />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No employees found.
                  </div>
                ) : (
                  <div className="space-y-5 pb-20">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={` flex items-center justify-between cursor-pointer transition-all duration-200 rounded-[30px] ${selectedEmployee?.id === emp.id
                          ? "bg-[#F1F1FF]"
                          : "hover:bg-gray-50/80"
                          }`}
                      >
                        {/* Left side: Avatar + Name */}
                        <div className="flex items-center gap-4 w-[30%] min-w-[150px]">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-[#E5E9FF] flex items-center justify-center shrink-0">
                            <span className="font-semibold text-sm text-[#4E61AD]">
                              {emp.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-[14px] font-normal text-gray-800 truncate">
                            {emp.fullName}
                          </h4>
                        </div>

                        {/* Middle: Email */}
                        <div className="flex items-center gap-2 text-[14px] text-gray-500 flex-1 min-w-[180px]">
                          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {emp.email || "No email provided"}
                          </span>
                        </div>

                        {/* Right: Phone + Menu */}
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="flex items-center gap-2 text-[14px] text-gray-500">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{emp.contactNumber}</span>
                          </div>
                          <button
                            onClick={(e) => handleMenuClick(e, emp.id)}
                            className="text-gray-500 hover:text-gray-900 p-1 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Employee Details */}
            <div className="flex-1 bg-[#FBFBFF] rounded-2xl shadow-sm border border-[#E4E4E7] p-6 h-full overflow-hidden">
              {selectedEmployee ? (
                <div className="max-w-2xl h-full flex flex-col">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-4 shrink-0">
                    <div className="w-[60px] h-[60px] rounded-[16px] bg-[#F1F6FA] flex flex-col overflow-hidden relative items-center justify-end shrink-0">
                      {/* Placeholder for real image, using the avatar shown in mockup if we had one. 
                          For now, we'll place the first letter in a similar colored box if no image, 
                          but user image in mockup is a Memoji. Let's use a stylish placeholder. */}
                      {selectedEmployee?.avatar ? (
                        <img src={selectedEmployee.avatar} alt="avatar" className="w-full h-full object-cover" />
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
                    {["Personal Information", "Earnings & Deductions", "Bank Details"].map((tab) => (
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
                    ))}
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
                            className={`text-[11px] font-semibold px-[12px] py-[2px] rounded-[4px] ${selectedEmployee.status === "INACTIVE" ? "bg-red-100/50 text-red-600" : "bg-[#D9EEDA] text-[#55AC73]"}`}
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

                        {/* Address 2 (As per mockup, duplicate) */}
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
                              ? new Date(
                                selectedEmployee.joinedDate,
                              ).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(',', '')
                              : "N/A"}
                          </div>
                        </div>

                        {/* Daily Rate */}
                        <div className="flex items-center pt-0.5">
                          <div className="w-[140px] flex items-center gap-2 text-[11px] font-medium text-[#AAAEBF]">
                            <DollarSign className="w-[14px] h-[14px]" />
                            <span>Daily Rate</span>
                          </div>
                          <div className="text-[12px] font-medium text-gray-700">
                            {(selectedEmployee.basicSalary ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Files Placeholder */}
                        <div className="mt-4 pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-[#AAAEBF] font-medium text-[11px] mb-3">
                            <FileText className="w-[14px] h-[14px]" />
                            <span>Files</span>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                              selectedEmployee.documents.map((doc) => (
                                <button
                                  key={doc.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (doc.fileType === 'application/pdf') {
                                      // Force Cloudinary to serve the file as an attachment to trigger the browser's download prompt
                                      let downloadUrl = doc.fileUrl;
                                      if (downloadUrl.includes('/upload/') && !downloadUrl.includes('fl_attachment')) {
                                        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                                      }

                                      const link = document.createElement('a');
                                      link.href = downloadUrl;
                                      link.download = doc.fileName;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    } else {
                                      setPreviewImage(doc.fileUrl);
                                    }
                                  }}
                                  title={doc.fileName}
                                  className="w-[74px] h-[74px] overflow-hidden border-[1.5px] border-[#E8ECEF] rounded-[10px] flex items-center justify-center bg-white hover:bg-[#F1F6FF] hover:border-[#9CBDFF] cursor-pointer transition-colors group relative"
                                >
                                  {doc.fileType.startsWith('image/') ? (
                                    <img src={doc.fileUrl} alt={doc.fileName} className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText className="w-[32px] h-[32px] text-[#AAAEBF] group-hover:text-[#4A7DFF] transition-colors" />
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="text-[12px] text-gray-400">No documents found</div>
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
                              <span className="text-[12px] font-semibold text-[#8B98A8]">Allowances</span>
                            </div>
                            <span className="text-[12px] font-semibold text-[#8B98A8] mr-2">Rs</span>
                          </div>
                          <div className="space-y-2">
                            {selectedEmployee.recurringAllowances && selectedEmployee.recurringAllowances.length > 0 ? (
                              selectedEmployee.recurringAllowances.map((allowance, index) => (
                                <div key={index} className="flex items-center justify-between pl-[28px] text-[12px] font-medium text-gray-800 pr-2">
                                  <span>{allowance.type}</span>
                                  <span>{allowance.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              ))
                            ) : (
                              <div className="pl-[28px] text-[12px] text-gray-400">No allowances found</div>
                            )}
                          </div>
                        </div>

                        {/* Deductions Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MinusCircle className="w-[16px] h-[16px] text-[#8B98A8]" />
                              <span className="text-[12px] font-semibold text-[#8B98A8]">Deductions</span>
                            </div>
                            <span className="text-[12px] font-semibold text-[#8B98A8] mr-2">Rs</span>
                          </div>
                          <div className="space-y-2">
                            {selectedEmployee.recurringDeductions && selectedEmployee.recurringDeductions.length > 0 ? (
                              selectedEmployee.recurringDeductions.map((deduction, index) => (
                                <div key={index} className="flex items-center justify-between pl-[28px] text-[12px] font-medium text-gray-800 pr-2">
                                  <span>{deduction.type}</span>
                                  <span>{deduction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              ))
                            ) : (
                              <div className="pl-[28px] text-[12px] text-gray-400">No deductions found</div>
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
                            <Users className="w-[16px] h-[16px]" />
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
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select an employee to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Universal Drawer (Add/Edit) */}
      <UniversalDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleDrawerSubmit}
        mode="employee"
        companyId={selectedCompanyId || undefined}
        initialData={editingEmployee || undefined}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={editingEmployee ? "Employee Updated" : "Employee Added"}
        message={modalMessage}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
      />

      {/* Addon Modal */}
      <AddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onSuccess={() => {
          setToast({
            message: "Slots purchased successfully!",
            type: "success",
          });
          // Optionally refresh data - employees not affected directly unless we show limits here?
          // But we can re-fetch just in case.
          // fetchEmployees(); // Handled by tags
        }}
        onUpgradePlan={() => {
          setIsAddonModalOpen(false);
          // Navigate to subscription
          window.location.href = "/settings?tab=subscription";
        }}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Portal Dropdown Menu */}
      <PortalDropdown
        anchorEl={menuAnchor}
        open={!!activeMenuId && !!menuAnchor}
        onClose={closeMenu}
      >
        {activeMenuEmployee && (
          <>
            <button
              onClick={() => handleEdit(activeMenuEmployee)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {activeMenuEmployee.status === "INACTIVE" ? (
              <button
                onClick={() => handleActivate(activeMenuEmployee)}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Activate
              </button>
            ) : (
              <button
                onClick={() => handleDeactivate(activeMenuEmployee)}
                className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Deactivate
              </button>
            )}
            <button
              onClick={() => handleRemove(activeMenuEmployee)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </>
        )}
      </PortalDropdown>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <Trash2 className="hidden" /> {/* just to import safely, use X ideally but don't want to mess up imports */}
              <span className="text-xl font-bold">× Close</span>
            </button>
            <img src={previewImage} alt="Document Preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
