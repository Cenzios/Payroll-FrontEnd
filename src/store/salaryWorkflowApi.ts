import { apiSlice } from './apiSlice';
import type { ApiEnvelope } from '../api/baseQuery';
import type { SalaryRecord } from '../types/salary.types';
import type { SalaryEntry } from './slices/salarySlice';

/** Editable inputs of a DRAFT salary (PUT /salary/:id). Money as decimal strings. */
export interface SalaryDraftEdit {
    workingDays: number;
    companyWorkingDays: number;
    otHours: string;
    salaryAdvance: string;
    leaveDays: number;
    sickLeaveDays: number;
    isEpfEnabled: boolean;
    isLoanEnabled: boolean;
    allowances: SalaryEntry[];
    deductions: SalaryEntry[];
}

export interface ApproveAllResult {
    month: number;
    year: number;
    approved: number;
    paidInstallments: number;
}

const TAGS = ['Salary', 'Employee', 'Dashboard'] as const;

/**
 * Salary draft workflow. New salaries are DRAFT; a draft can be edited, regenerated or voided
 * until it is approved, which locks it. Every call returns the whole envelope so the page can
 * show the API's message.
 */
export const salaryWorkflowApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateDraftSalary: builder.mutation<ApiEnvelope<SalaryRecord>, { id: string; companyId: string; data: SalaryDraftEdit }>({
            query: ({ id, companyId, data }) => ({ url: `/salary/${id}`, method: 'PUT', params: { companyId }, data, envelope: true }),
            invalidatesTags: [...TAGS],
        }),
        regenerateDraftSalary: builder.mutation<ApiEnvelope<SalaryRecord>, { id: string; companyId: string }>({
            query: ({ id, companyId }) => ({ url: `/salary/${id}/regenerate`, method: 'POST', params: { companyId }, envelope: true }),
            invalidatesTags: [...TAGS],
        }),
        voidDraftSalary: builder.mutation<ApiEnvelope<{ id: string }>, { id: string; companyId: string }>({
            query: ({ id, companyId }) => ({ url: `/salary/${id}`, method: 'DELETE', params: { companyId }, envelope: true }),
            invalidatesTags: [...TAGS],
        }),
        approveSalary: builder.mutation<ApiEnvelope<SalaryRecord>, { id: string; companyId: string }>({
            query: ({ id, companyId }) => ({ url: `/salary/${id}/approve`, method: 'POST', params: { companyId }, envelope: true }),
            invalidatesTags: [...TAGS],
        }),
        approveAllDrafts: builder.mutation<ApiEnvelope<ApproveAllResult>, { companyId: string; month: number; year: number }>({
            query: (data) => ({ url: '/salary/approve-all', method: 'POST', data, envelope: true }),
            invalidatesTags: [...TAGS],
        }),
    }),
});

export const {
    useUpdateDraftSalaryMutation,
    useRegenerateDraftSalaryMutation,
    useVoidDraftSalaryMutation,
    useApproveSalaryMutation,
    useApproveAllDraftsMutation,
} = salaryWorkflowApi;
