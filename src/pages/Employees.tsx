import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Phone, Mail, User, Briefcase, Edit, Trash2, Ban, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EmployeeDetailsCard from "../components/EmployeeDetailsCard";
import UniversalDrawer from "../components/UniversalDrawer";
import SuccessModal from "../components/SuccessModal";
import ConfirmationModal from "../components/ConfirmationModal";
import AddonModal from "../components/AddonModal";
import FileUploadModal from "../components/FileUploadModal";
import { useAppSelector } from "../store/hooks";
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useUploadEmployeeDocumentMutation,
  useDeleteEmployeeDocumentMutation,
} from "../store/apiSlice";
import { Employee } from '../types/employee.types';
import PageHeader from '../components/PageHeader';
import Toast from "../components/Toast";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import PortalDropdown from "../components/PortalDropdown";
import AlertBar from "../components/AlertBar";

const Employees = () => {
  const { selectedCompanyId } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");

  // Mobile view state: "list" | "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

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
  const [deleteEmployeeDocument] = useDeleteEmployeeDocumentMutation();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
    isLoading?: boolean;
  }>({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => { },
    isLoading: false,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Edit State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quick File Upload State
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [quickUploadFiles, setQuickUploadFiles] = useState<File[]>([]);
  const [quickUploadTitles, setQuickUploadTitles] = useState<Record<number, string>>({});
  const [isQuickUploading, setIsQuickUploading] = useState(false);

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

  // Sync selected employee when list updates (e.g. after document upload)
  useEffect(() => {
    if (selectedEmployee && employees.length > 0) {
      const updatedEmployee = employees.find(e => e.id === selectedEmployee.id);
      if (updatedEmployee && JSON.stringify(updatedEmployee) !== JSON.stringify(selectedEmployee)) {
        setSelectedEmployee(updatedEmployee);
      }
    }
  }, [employees]);

  // Sync menu anchor with activeMenuId
  useEffect(() => {
    if (!activeMenuId) {
      setMenuAnchor(null);
    }
  }, [activeMenuId]);

  // Handle employee selection — on mobile, also switch to detail view
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setMobileView("detail");
  };

  const handleOpenLimitModal = () => {
    setConfirmation({
      isOpen: true,
      type: "warning",
      title: "Employee Limit Reached",
      message:
        "You've reached the maximum number of Employees allowed on your current plan. To add more Employees, please upgrade your plan.",
      confirmText: "Update Plan",
      onConfirm: () => {
        setIsAddonModalOpen(true);
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleQuickUpload = async () => {
    if (!selectedEmployee || !selectedCompanyId || quickUploadFiles.length === 0) return;

    const existingCount = selectedEmployee.documents?.length || 0;
    const totalAfterUpload = existingCount + quickUploadFiles.length;

    if (totalAfterUpload > 3) {
      setToast({
        message: `Cannot upload. Total documents would exceed the limit of 3 (Existing: ${existingCount}, New: ${quickUploadFiles.length})`,
        type: "error"
      });
      return;
    }

    setIsQuickUploading(true);
    try {
      let uploadCount = 0;
      for (let i = 0; i < quickUploadFiles.length; i++) {
        const file = quickUploadFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("employeeId", selectedEmployee.id);
        if (quickUploadTitles[i]) formData.append("docTitle", quickUploadTitles[i]);
        await uploadEmployeeDocument(formData).unwrap();
        uploadCount++;
      }

      setToast({ message: `Successfully uploaded ${uploadCount} document(s)`, type: "success" });
      setIsFileModalOpen(false);
      setQuickUploadFiles([]);
      setQuickUploadTitles({});
    } catch (error: any) {
      setToast({
        message: error?.data?.message || error?.message || "Failed to upload documents",
        type: "error",
      });
    } finally {
      setIsQuickUploading(false);
    }
  };

  const handleDeleteFileClick = (documentId: string, fileName: string) => {
    setConfirmation({
      isOpen: true,
      type: "danger",
      title: "Delete Document",
      message: `Are you sure you want to delete the document "${fileName}"? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmation((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteEmployeeDocument(documentId).unwrap();
          setToast({ message: "Document deleted successfully", type: "success" });
        } catch (error: any) {
          setToast({
            message: error?.data?.message || error?.message || "Failed to delete document",
            type: "error",
          });
        } finally {
          setConfirmation((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleDrawerSubmit = async (data: any, files?: File[], fileTitles?: Record<number, string>) => {
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
        const existingCount = editingEmployee?.documents?.length || 0;
        const totalAfterUpload = existingCount + files.length;

        if (totalAfterUpload > 3) {
          setToast({
            message: `Cannot upload. Total documents would exceed the limit of 3 (Existing: ${existingCount}, New: ${files.length})`,
            type: "error"
          });
          return;
        }

        setToast({ message: "Uploading documents...", type: "success" });
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("employeeId", savedEmployee.id);
          if (fileTitles && fileTitles[i]) {
            formData.append("docTitle", fileTitles[i]);
          }
          await uploadEmployeeDocument(formData).unwrap();
        }
      }

      const isEdit = !!editingEmployee;
      setIsDrawerOpen(false);
      setEditingEmployee(null);
      setSelectedEmployee(savedEmployee);

      setModalTitle(isEdit ? "Changes Saved" : "Employee Added");
      setModalMessage(
        isEdit
          ? "Employee details updated successfully."
          : "You have successfully added a new employee.",
      );
      setShowSuccessModal(true);
      if (!isEdit && selectedCompanyId) {
        localStorage.removeItem(`employee_add_draft_${selectedCompanyId}`);
      }
    } catch (error: any) {
      if (error.message && error.message.includes("limit reached")) {
        handleOpenLimitModal();
      } else {
        let errorMessage = "Operation failed";

        if (error.data && error.data.message) {
          errorMessage = error.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (errorMessage === "Employee with this NIC already exists in this company" || errorMessage.includes("NIC already exists")) {
          errorMessage = "NIC already exists in this company";
        }

        setToast({
          message: errorMessage,
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
          const updated = await updateEmployee({
            id: employee.id,
            companyId: selectedCompanyId,
            data: { status: "INACTIVE" } as any,
          }).unwrap();
          setToast({
            message: "Employee deactivated successfully",
            type: "success",
          });
          if (selectedEmployee?.id === employee.id) {
            setSelectedEmployee(updated);
          }
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
          if (selectedEmployee?.id === employee.id) {
            setSelectedEmployee(null);
            setMobileView("list"); // Go back to list after removal on mobile
          }
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
          const updated = await updateEmployee({
            id: employee.id,
            companyId: selectedCompanyId,
            data: { status: "ACTIVE" } as any,
          }).unwrap();
          setToast({
            message: "Employee activated successfully",
            type: "success",
          });
          if (selectedEmployee?.id === employee.id) {
            setSelectedEmployee(updated);
          }
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans
    max-sm:h-auto max-sm:overflow-auto">
      <AlertBar />

      <div className="-mb-4 shrink-0"></div>

      <div className="flex flex-1 overflow-hidden relative w-full translate-x-0
      max-sm:flex-col max-sm:overflow-visible">
        <Sidebar />

        <div className="flex-1 ml-64 p-6 h-screen overflow-hidden flex flex-col
          max-sm:ml-0 max-sm:p-0 max-sm:h-auto max-sm:overflow-visible">

          {/* ─── DESKTOP layout ─── */}
          <div className="contents max-sm:hidden">
            <div className="shrink-0 px-6 pt-6">
              <PageHeader
                title="Employees"
                subtitle="Here's Your Employees Overview"
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
                  >
                    Add New Employee
                    <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center ml-1">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                }
              />
            </div>

            {!selectedCompanyId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h3>
                  <p className="text-gray-500">Please go to the Dashboard and select a company to view employees.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 flex-1 overflow-hidden pb-4 px-6">
                {/* Left Column */}
                <div className="w-[60%] flex flex-col pr-6 h-full">
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
                            className={`flex items-center justify-between cursor-pointer transition-all duration-200 rounded-[30px] ${selectedEmployee?.id === emp.id ? "bg-blue-200/40" : "hover:bg-gray-50/80"}`}
                          >
                            <div className="flex items-center gap-4 w-[30%] min-w-[250px]">
                              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                                <span className="font-semibold text-sm text-blue-700">{emp.fullName.charAt(0).toUpperCase()}</span>
                              </div>
                              <h4 className="text-[14px] font-normal text-gray-800 truncate">{emp.fullName}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-[14px] text-gray-500 flex-1 min-w-[220px]">
                              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="truncate">{emp.email || "No email provided"}</span>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="flex items-center gap-2 text-[14px] text-gray-500 flex-1 min-w-[100px]">
                                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>{emp.contactNumber}</span>
                              </div>
                              <button onClick={(e) => handleMenuClick(e, emp.id)}
                                className="text-gray-500 hover:text-gray-900 p-1 rounded-full transition-colors">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <EmployeeDetailsCard
                  selectedEmployee={selectedEmployee}
                  setPreviewImage={setPreviewImage}
                  onAddFileClick={() => setIsFileModalOpen(true)}
                  onDeleteFileClick={handleDeleteFileClick}
                  onEditClick={() => selectedEmployee && handleEdit(selectedEmployee)}
                  isAddFileDisabled={(selectedEmployee?.documents?.length || 0) >= 3}
                />
              </div>
            )}
          </div>

          {/* MOBILE layout */}
          <div className="hidden max-sm:flex flex-col flex-1 min-h-screen">

            {/* MOBILE: List View */}
            <div className={`flex flex-col flex-1 ${mobileView === "list" ? "block" : "hidden"}`}>
              {/* Mobile Header */}
              <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Employees</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Here's Your Employees Overview</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedCompanyId) {
                        setToast({ message: "Please select a company from the Dashboard first.", type: "error" });
                        return;
                      }
                      openAddDrawer();
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Mobile Search */}
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

              {/* Mobile Employee List */}
              {!selectedCompanyId ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h3>
                    <p className="text-gray-500 text-sm">Please go to the Dashboard and select a company to view employees.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 pb-24">
                  {isLoading ? (
                    <div className="py-4"><TableSkeleton rows={5} /></div>
                  ) : employees.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">No employees found.</div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {employees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          className={`flex items-center justify-between cursor-pointer transition-all duration-200 rounded-2xl px-3 py-3 ${selectedEmployee?.id === emp.id ? "bg-blue-100/60" : "bg-white hover:bg-gray-50"} shadow-sm`}
                        >
                          {/* Avatar + Name + Email */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                              <span className="font-semibold text-sm text-blue-700">{emp.fullName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-medium text-gray-800 truncate">{emp.fullName}</p>
                              <p className="text-[12px] text-gray-400 truncate">{emp.email || "No email"}</p>
                              <p className="text-[12px] text-gray-400 truncate">{emp.contactNumber}</p>
                            </div>
                          </div>

                          {/* Status badge + kebab */}
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {emp.status === "ACTIVE" && (
                              <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                            )}
                            {emp.status === "INACTIVE" && (
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">INACTIVE</span>
                            )}
                            {/* {emp.status === "ON_LEAVE" && (
                              <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">ON LEAVE</span>
                            )} */}
                            <button
                              onClick={(e) => handleMenuClick(e, emp.id)}
                              className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE Detail View */}
            <div className={`flex flex-col flex-1 ${mobileView === "detail" ? "block" : "hidden"}`}>
              {/* Back button header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 bg-white shrink-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center gap-1.5 text-blue-600 font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Employees
                </button>
              </div>

              {/* Employee Detail Card mobile */}
              <div className="flex-1 overflow-y-auto pb-24">
                <EmployeeDetailsCard
                  selectedEmployee={selectedEmployee}
                  setPreviewImage={setPreviewImage}
                  onAddFileClick={() => setIsFileModalOpen(true)}
                  onDeleteFileClick={handleDeleteFileClick}
                  onEditClick={() => selectedEmployee && handleEdit(selectedEmployee)}
                  isAddFileDisabled={(selectedEmployee?.documents?.length || 0) >= 3}
                />
              </div>
            </div>
          </div>
        </div>
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

      {/* Quick File Upload Modal */}
      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => {
          if (!isQuickUploading) {
            setIsFileModalOpen(false);
            setQuickUploadFiles([]);
            setQuickUploadTitles({});
          }
        }}
        files={quickUploadFiles}
        onFilesChange={setQuickUploadFiles}
        fileTitles={quickUploadTitles}
        onTitlesChange={setQuickUploadTitles}
        onUpload={handleQuickUpload}
        isUploading={isQuickUploading}
        maxFiles={3 - (selectedEmployee?.documents?.length || 0)}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalTitle}
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
        isLoading={confirmation.isLoading}
      />

      {/* Addon Modal */}
      <AddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onSuccess={() => {
          setToast({ message: "Slots purchased successfully!", type: "success" });
        }}
        onUpgradePlan={() => {
          setIsAddonModalOpen(false);
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
            <button onClick={() => handleEdit(activeMenuEmployee)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit
            </button>
            {activeMenuEmployee.status === "INACTIVE" ? (
              <button onClick={() => handleActivate(activeMenuEmployee)} className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                <User className="w-4 h-4" /> Activate
              </button>
            ) : (
              <button onClick={() => handleDeactivate(activeMenuEmployee)} className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Deactivate
              </button>
            )}
            <button onClick={() => handleRemove(activeMenuEmployee)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </>
        )}
      </PortalDropdown>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
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