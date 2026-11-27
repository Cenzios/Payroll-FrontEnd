/** Money fields are decimal strings (API contract). */
export interface RecurringEntry {
    type: string;
    amount: string;
}

export interface EmployeeDocument {
    id: string;
    docTitle?: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    publicId: string;
    createdAt: string;
    documentType?: 'EMPLOYEE' | 'LOAN';
}

/** Paid-leave balance of one calendar year (entitlement resets every year). */
export interface LeaveBalance {
    year: number;
    entitlement: number;
    used: number;
    remaining: number;
}

export interface Employee {
    id: string;
    fullName: string;
    address: string;
    employeeId: string;
    contactNumber: string;
    joinedDate: string;
    designation: string;
    department: string;
    email?: string;
    basicSalary: string;
    salaryType?: 'DAILY' | 'MONTHLY';
    /** Annual paid-leave entitlement (days). Same value as annualLeave (older name). */
    paidLeave: number;
    annualLeave?: number;
    /** Paid leave left in the current calendar year (from the employee list API). */
    leaveBalance?: LeaveBalance;
    otRate: string;
    epfEnabled: boolean;
    epfNumber?: string;
    epfEtfAmount?: string | null;
    allowanceEnabled: boolean;
    deductionEnabled: boolean;
    employeeNIC?: string;
    status: 'ACTIVE' | 'INACTIVE';
    companyId: string;
    createdAt?: string;
    updatedAt?: string;
    recurringAllowances?: RecurringEntry[];
    recurringDeductions?: RecurringEntry[];
    bankName?: string;
    accountNumber?: string;
    branchName?: string;
    accountHolderName?: string;
    documents?: EmployeeDocument[];
    avatar?: string;
    hasActiveLoan?: boolean;
}

export interface CreateEmployeeRequest {
    fullName: string;
    address: string;
    employeeId: string;
    contactNumber: string;
    joinedDate: string;
    designation: string;
    department: string;
    email?: string;
    basicSalary: string;
    salaryType?: 'DAILY' | 'MONTHLY';
    paidLeave?: number;
    otRate?: string;
    epfEnabled?: boolean;
    epfNumber?: string;
    epfEtfAmount?: string;
    allowanceEnabled?: boolean;
    deductionEnabled?: boolean;
    employeeNIC?: string;
    companyId: string;
    recurringAllowances?: RecurringEntry[];
    recurringDeductions?: RecurringEntry[];
    bankName?: string;
    accountNumber?: string;
    branchName?: string;
    accountHolderName?: string;
}
