export interface RecurringEntry {
    type: string;
    amount: number;
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
    basicSalary: number;
    salaryType?: 'DAILY' | 'MONTHLY';
    otRate: number;
    epfEnabled: boolean;
    epfNumber?: string;
    epfEtfAmount?: number;
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
    basicSalary: number;
    salaryType?: 'DAILY' | 'MONTHLY';
    otRate?: number;
    epfEnabled?: boolean;
    epfNumber?: string;
    epfEtfAmount?: number;
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
