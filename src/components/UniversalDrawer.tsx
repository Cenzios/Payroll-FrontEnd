/**
 * UniversalDrawer — thin routing wrapper.
 *
 * This file exists solely to preserve backward compatibility with
 * existing call sites (Employees.tsx, Dashboard.tsx, Companies.tsx).
 * All logic lives in the focused components under drawers/.
 */
import { useState, useEffect } from "react";
import EmployeeDrawer from "./drawers/EmployeeDrawer";
import CompanyDrawer from "./drawers/CompanyDrawer";
import { useGetDashboardSummaryQuery } from "../store/apiSlice";
import { AlertTriangle } from "lucide-react";

interface UniversalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, files?: File[], fileTitles?: Record<number, string>) => Promise<void>;
  mode: "company" | "employee";
  companyId?: string;
  initialData?: any;
}

const UniversalDrawer = ({ isOpen, onClose, onSubmit, mode, companyId, initialData }: UniversalDrawerProps) => {
  const { data: dashboardData } = useGetDashboardSummaryQuery(companyId, { skip: !companyId || mode !== "employee" });

  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const paidLimit = parseInt(localStorage.getItem('paid_employee_limit') || '0');

  useEffect(() => {
    if (isOpen && mode === "employee" && !initialData && dashboardData) {
      // if (dashboardData.totalEmployees >= dashboardData.maxEmployees && !isConfirmed) {
      if (paidLimit > 0 && dashboardData.totalEmployees >= paidLimit && !isConfirmed) {
        setShowLimitWarning(true);
      }
    } else if (!isOpen) {
      // Reset when closed
      setShowLimitWarning(false);
      setIsConfirmed(false);
    }
  }, [isOpen, mode, initialData, dashboardData, isConfirmed]);

  const handleConfirm = () => {
    setShowLimitWarning(false);
    setIsConfirmed(true);
  };

  const handleCancel = () => {
    setShowLimitWarning(false);
    onClose();
  };

  if (showLimitWarning) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl shadow-xl p-9 w-[400px] flex flex-col items-center text-center gap-4">

          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="text-yellow-500" size={30} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900">Just heads-up!</h3>

          {/* Message */}
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Each new employee adds Rs.100 to your upcoming monthly bills.
            This will show up on your next billing cycle.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 w-full mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-800 font-semibold text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm"
            >
              Confirm
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (mode === "company") {
    return (
      <CompanyDrawer
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
      />
    );
  }

  return (
    <EmployeeDrawer
      isOpen={isOpen && !showLimitWarning}
      onClose={onClose}
      onSubmit={onSubmit}
      companyId={companyId}
      initialData={initialData}
    />
  );
};

export default UniversalDrawer;
