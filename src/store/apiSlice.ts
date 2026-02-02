import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { Company, CreateCompanyRequest } from '../types/company.types';
import { Employee, CreateEmployeeRequest } from '../types/employee.types';
import { Notification, NotificationType } from '../types/notification.types';

// Define types locally if not exported from files, or reuse existing types
// We'll trust the types exist or use 'any' where strict typing isn't critical for the task
interface DashboardSummary {
    totalEmployees: number;
    totalSalaryPaidThisMonth: number;
    totalCompanyETF: number;
    totalEmployeeEPF: number;
    maxEmployees: number;
    planName: string;
    remainingSlots: number;
}

interface GetEmployeesParams {
    companyId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

interface GetEmployeesResponse {
    employees: Employee[];
    total: number;
    totalPages: number;
}

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: axiosBaseQuery({ baseUrl: '' }), // baseUrl handled by axiosInstance
    tagTypes: ['Dashboard', 'Company', 'Employee', 'Subscription', 'Notification'],
    endpoints: (builder) => ({
        // --- DASHBOARD ---
        getDashboardSummary: builder.query<DashboardSummary, string | undefined>({
            query: (companyId) => ({
                url: '/dashboard/summary',
                method: 'GET',
                params: companyId ? { companyId } : {},
            }),
            providesTags: ['Dashboard'],
            keepUnusedDataFor: 300, // 5 minutes cache
        }),

        // --- COMPANIES ---
        getCompanies: builder.query<Company[], void>({
            query: () => ({ url: '/company', method: 'GET' }),
            providesTags: ['Company'],
            keepUnusedDataFor: 300,
        }),

        createCompany: builder.mutation<Company, CreateCompanyRequest>({
            query: (data) => ({
                url: '/company',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Company', 'Dashboard'],
        }),

        // --- EMPLOYEES ---
        getEmployees: builder.query<GetEmployeesResponse, GetEmployeesParams>({
            query: (params) => ({
                url: '/employee',
                method: 'GET',
                params,
            }),
            providesTags: ['Employee'],
            keepUnusedDataFor: 120, // 2 mins cache for active lists
        }),

        createEmployee: builder.mutation<Employee, CreateEmployeeRequest>({
            query: (data) => ({
                url: '/employee',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Employee', 'Dashboard'],
        }),

        updateEmployee: builder.mutation<Employee, { id: string; companyId: string; data: Partial<CreateEmployeeRequest> }>({
            query: ({ id, companyId, data }) => ({
                url: `/employee/${id}`,
                method: 'PUT',
                data: { ...data, companyId },
            }),
            invalidatesTags: ['Employee', 'Dashboard'],
        }),

        deleteEmployee: builder.mutation<void, { id: string; companyId: string }>({
            query: ({ id, companyId }) => ({
                url: `/employee/${id}`,
                method: 'DELETE',
                params: { companyId },
            }),
            invalidatesTags: ['Employee', 'Dashboard'],
        }),

        // --- SUBSCRIPTION ---
        getSubscription: builder.query<any, void>({
            query: () => ({ url: '/subscription/current', method: 'GET' }),
            providesTags: ['Subscription'],
        }),
        getActiveSubscription: builder.query<any, void>({
            query: () => ({ url: '/subscription/active', method: 'GET' }),
            providesTags: ['Subscription'],
        }),

        changePlan: builder.mutation<any, { newPlanId: string }>({
            query: (data) => ({
                url: '/subscription/change-plan',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Subscription', 'Dashboard'],
        }),

        addAddon: builder.mutation<any, { type: string; value: number }>({
            query: (data) => ({
                url: '/subscription/addon',
                method: 'POST',
                data
            }),
            invalidatesTags: ['Subscription', 'Dashboard']
        }),

        cancelSubscription: builder.mutation<any, void>({
            query: () => ({
                url: '/subscription/cancel',
                method: 'POST',
            }),
            invalidatesTags: ['Subscription', 'Dashboard']
        }),

        // --- NOTIFICATIONS ---
        getNotifications: builder.query<Notification[], { includeRead?: boolean } | void>({
            query: (params) => ({
                url: '/notifications',
                method: 'GET',
                params: params || {},
            }),
            providesTags: ['Notification'],
        }),

        getUnreadCount: builder.query<{ count: number }, void>({
            query: () => ({ url: '/notifications/unread-count', method: 'GET' }),
            providesTags: ['Notification'],
        }),

        markNotificationAsRead: builder.mutation<Notification, string>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'PUT',
            }),
            invalidatesTags: ['Notification'],
        }),

        deleteNotification: builder.mutation<Notification, string>({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notification'],
        }),

        deleteAllNotifications: builder.mutation<void, void>({
            query: () => ({
                url: '/notifications/all',
                method: 'DELETE',
            }),
            invalidatesTags: ['Notification'],
        })
    }),
});

export const {
    useGetDashboardSummaryQuery,
    useGetCompaniesQuery,
    useCreateCompanyMutation,
    useGetEmployeesQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
    useGetSubscriptionQuery,
    useGetActiveSubscriptionQuery,
    useChangePlanMutation,
    useAddAddonMutation,
    useCancelSubscriptionMutation,
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkNotificationAsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation
} = apiSlice;
