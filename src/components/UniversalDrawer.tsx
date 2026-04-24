/**
 * UniversalDrawer — thin routing wrapper.
 *
 * This file exists solely to preserve backward compatibility with
 * existing call sites (Employees.tsx, Dashboard.tsx, Companies.tsx).
 * All logic lives in the focused components under drawers/.
 */
import EmployeeDrawer from "./drawers/EmployeeDrawer";
import CompanyDrawer from "./drawers/CompanyDrawer";

interface UniversalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, files?: File[], fileTitles?: Record<number, string>) => Promise<void>;
  mode: "company" | "employee";
  companyId?: string;
  initialData?: any;
}

const UniversalDrawer = ({ isOpen, onClose, onSubmit, mode, companyId, initialData }: UniversalDrawerProps) => {
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
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      companyId={companyId}
      initialData={initialData}
    />
  );
};

export default UniversalDrawer;
