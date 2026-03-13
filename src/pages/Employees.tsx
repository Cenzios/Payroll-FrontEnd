import { useState, useEffect } from "react";
import {
  Plus,
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
  CreditCard,
  GitBranch,
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
} from "../store/apiSlice";
import { Employee, Department } from '../types/employee.types';
import PageHeader from '../components/PageHeader';
import Toast from "../components/Toast";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import PortalDropdown from "../components/PortalDropdown";
import HeaderActions from "../components/HeaderActions";

const Employees = () => {
  const { selectedCompanyId } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");

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
    onConfirm: () => {},
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Edit State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

  const handleDrawerSubmit = async (data: any) => {
    try {
      if (editingEmployee) {
        if (!selectedCompanyId) throw new Error("No company selected");
        await updateEmployee({
          id: editingEmployee.id,
          companyId: selectedCompanyId,
          data,
        }).unwrap();
      } else {
        await createEmployee(data).unwrap();
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

      <div className="flex-1 ml-64 p-8 h-screen flex flex-col overflow-hidden">
        {/* Header */}
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
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white pl-5 pr-2 py-2 rounded-full text-sm font-semibold transition-colors"
                title={!selectedCompanyId ? "Please select a company from the Dashboard first" : ""}
              >
                Add Employee
                <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center ml-1">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            }
          />

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
                        className={` flex items-center justify-between cursor-pointer transition-all duration-200 rounded-[30px] ${
                          selectedEmployee?.id === emp.id
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
                          <h4 className="text-[14px] font-regular text-[#3D4760] truncate">
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
            <div className="flex-1 bg-[#FBFBFF] rounded-2xl shadow-sm border border-[#E4E4E7] p-8 h-full overflow-y-auto">
              {selectedEmployee ? (
                <div className="max-w-xl">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4 border-b border-gray-50 pb-6">
                    <div className="w-[64px] h-[64px] rounded-2xl bg-[#E5E9FF] flex items-center justify-center shrink-0">
                      <span className="font-semibold text-3xl text-[#4E61AD]">
                        {selectedEmployee.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h2 className="text-[16px] font-semibold text-[#3D4760] leading-tight mb-1">
                        {selectedEmployee.fullName}
                      </h2>
                      <p className="text-[14px] text-gray-500 font-medium">
                        {selectedEmployee.employeeId}
                      </p>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <User className="w-[16px] h-[16px]" />
                        <span>Name</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760]">
                        {selectedEmployee.fullName}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <Mail className="w-[16px] h-[16px]" />
                        <span>Email</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760]">
                        {selectedEmployee.email || "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <MapPin className="w-[16px] h-[16px]" />
                        <span>Address</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760] max-w-[280px] break-words">
                        {selectedEmployee.address}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <Briefcase className="w-[16px] h-[16px]" />
                        <span>Designation</span>
                      </div>
                      <div className="text-[13px] font-medium text-blue-500 bg-white border border-blue-200 px-3 py-1 rounded-md">
                        {selectedEmployee.designation || "None"}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <Flag className="w-[16px] h-[16px]" />
                        <span>Status</span>
                      </div>
                      <div
                        className={`text-[13px] font-medium px-4 py-1 rounded-md ${selectedEmployee.status === "INACTIVE" ? "bg-red-100 text-red-600" : "bg-[#D1EED8] text-[#429559]"}`}
                      >
                        {selectedEmployee.status === "INACTIVE"
                          ? "Inactive"
                          : "Active"}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <Phone className="w-[16px] h-[16px]" />
                        <span>Phone Number</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760]">
                        {selectedEmployee.contactNumber}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <Calendar className="w-[16px] h-[16px]" />
                        <span>Joining Date</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760]">
                        {selectedEmployee.joinedDate
                          ? new Date(
                              selectedEmployee.joinedDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                        <DollarSign className="w-[16px] h-[16px]" />
                        <span>Daily Rate</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#3D4760]">
                        {(selectedEmployee.basicSalary ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="mt-2 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 font-medium text-[14px] mb-5">
                      <Landmark className="w-[16px] h-[16px]" />
                      <span>Bank Details</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                          <Landmark className="w-[14px] h-[14px]" />
                          <span>Bank name</span>
                        </div>
                        <div className="text-[13px] font-medium text-[#3D4760]">
                          {selectedEmployee.bankName || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                          <CreditCard className="w-[14px] h-[14px]" />
                          <span>Account number</span>
                        </div>
                        <div className="text-[13px] font-medium text-[#3D4760]">
                          {selectedEmployee.accountNumber || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-[160px] flex items-center gap-2 text-[12px] font-medium text-gray-400">
                          <User className="w-[14px] h-[14px]" />
                          <span>Account name</span>
                        </div>
                        <div className="text-[13px] font-medium text-[#3D4760]">
                          {selectedEmployee.accountHolderName || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Files Placeholder */}
                  <div className="mt-6 border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-gray-400 font-medium text-[14px] mb-5">
                      <FileText className="w-[16px] h-[16px]" />
                      <span>Files</span>
                    </div>
                    <div className="flex gap-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-[90px] h-[90px] border border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {/* In a real app we'd map employee.files, for mockup we show placeholders */}
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-400">
                            <FileText className="w-5 h-5" />
                          </div>
                        </div>
                      ))}
                    </div>
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
    </div>
  );
};

export default Employees;
