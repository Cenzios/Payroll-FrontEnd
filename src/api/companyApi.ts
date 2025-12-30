import axiosInstance from './axios';
import {
    Company,
    CreateCompanyRequest,
    CreateCompanyResponse,
    GetCompaniesResponse
} from '../types/company.types';

export const companyApi = {
    // Get all companies
    getCompanies: async (): Promise<Company[]> => {
        try {
            const response = await axiosInstance.get<GetCompaniesResponse>('/company');
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch companies');
        }
    },

    // Create a new company
    createCompany: async (data: CreateCompanyRequest): Promise<Company> => {
        try {
            const response = await axiosInstance.post<CreateCompanyResponse>('/company', data);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create company');
        }
    },

    // Update company profile
    updateCompanyProfile: async (id: string, data: Partial<CreateCompanyRequest>): Promise<Company> => {
        try {
            const response = await axiosInstance.put<{ data: Company }>(`/company/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update company profile');
        }
    },
};

export default companyApi;
