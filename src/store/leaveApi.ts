import { apiSlice } from './apiSlice';
import type { LeaveBalance } from '../types/employee.types';

/**
 * Annual paid-leave balances. The entitlement resets every calendar year; the API computes
 * remaining = entitlement - leave used in that year's salaries (drafts included).
 */
export const leaveApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /** employeeId -> balance for one year (Salary page). */
        getCompanyLeaveBalances: builder.query<Record<string, LeaveBalance>, { companyId: string; year: number }>({
            query: (params) => ({ url: '/employee/leave-balances', method: 'GET', params }),
            providesTags: ['Salary', 'Employee'],
        }),
        /** One row per year, newest first (employee details card). */
        getEmployeeLeaveHistory: builder.query<LeaveBalance[], { companyId: string; employeeId: string }>({
            query: ({ companyId, employeeId }) => ({
                url: `/employee/${employeeId}/leave-balances`,
                method: 'GET',
                params: { companyId },
            }),
            providesTags: ['Salary', 'Employee'],
        }),
    }),
});

export const { useGetCompanyLeaveBalancesQuery, useGetEmployeeLeaveHistoryQuery } = leaveApi;
