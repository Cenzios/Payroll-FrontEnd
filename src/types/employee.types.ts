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
    dailyRate: number;
    otRate: number;
    epfEnabled: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    companyId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEmployeeRequest {
    fullName: string;
    address: string;
    employeeId: string;
    contactNumber: string;
    joinedDate: string;
    designation: string;
    department: string;
    email?: string; // Optional as per user request flow, but schema has it
    dailyRate: number;
    otRate?: number;
    companyId: string;
}
