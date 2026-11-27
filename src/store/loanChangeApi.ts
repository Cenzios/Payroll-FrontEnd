import { apiSlice, type Loan, type SettlementMethod } from './apiSlice';
import type { ApiEnvelope } from '../api/baseQuery';

/** PUT /loans/:id body. Money and rates as decimal strings, dates YYYY-MM-DD. */
export interface LoanEditRequest {
    loanTitle?: string;
    description?: string | null;
    amount?: string;
    interestRate?: string;
    interestRateType?: 'MONTHLY' | 'ANNUALLY';
    installmentCount?: number;
    startDate?: string;
    reason?: string;
}

export interface LoanSettleRequest {
    amount: string;
    settledAt: string;
    method: SettlementMethod;
    note?: string;
    reason?: string;
}

/** Loan edit / early settlement / cancellation. Whole envelopes, so the UI shows the API message. */
export const loanChangeApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateLoan: builder.mutation<ApiEnvelope<Loan>, { id: string; companyId: string; data: LoanEditRequest }>({
            query: ({ id, companyId, data }) => ({ url: `/loans/${id}`, method: 'PUT', params: { companyId }, data, envelope: true }),
            invalidatesTags: ['Employee', 'Dashboard'],
        }),
        settleLoan: builder.mutation<ApiEnvelope<Loan>, { id: string; companyId: string; data: LoanSettleRequest }>({
            query: ({ id, companyId, data }) => ({ url: `/loans/${id}/settle`, method: 'POST', params: { companyId }, data, envelope: true }),
            invalidatesTags: ['Employee', 'Dashboard', 'Salary'],
        }),
        cancelLoan: builder.mutation<ApiEnvelope<Loan>, { id: string; companyId: string; reason?: string }>({
            query: ({ id, companyId, reason }) => ({ url: `/loans/${id}/cancel`, method: 'POST', params: { companyId }, data: { reason }, envelope: true }),
            invalidatesTags: ['Employee', 'Dashboard', 'Salary'],
        }),
    }),
});

export const { useUpdateLoanMutation, useSettleLoanMutation, useCancelLoanMutation } = loanChangeApi;
