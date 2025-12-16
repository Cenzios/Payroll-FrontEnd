export interface Company {
    id: string;
    name: string;
    email: string;
    address: string;
    contactNumber: string;
    departments: string[];
    ownerId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCompanyRequest {
    name: string;
    email: string;
    address: string;
    contactNumber: string;
    departments: string[];
}

export interface CreateCompanyResponse {
    success: boolean;
    message: string;
    data: Company;
}

export interface GetCompaniesResponse {
    success: boolean;
    data: Company[];
}
