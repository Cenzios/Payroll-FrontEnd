export interface Employee {
    id: string;
    fullName: string;
    address: string;
    nic: string;
    employeeId: string;
    contactNumber: string;
    joinedDate: string;
    designation: string;
    department: string;
    email?: string;
    dailyRate: number;
    epfEnabled: boolean;
    companyId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEmployeeRequest {
    fullName: string;
    address: string;
    nic: string;
    employeeId: string;
    contactNumber: string;
    joinedDate: string;
    designation: string;
    department: string;
    email?: string; // Optional as per user request flow, but schema has it
    dailyRate: number;
    companyId: string;
}
