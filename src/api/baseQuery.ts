import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosInstance from './axios';

/** Standard API envelope (only the fields the client relies on). */
export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

const isEnvelope = (body: unknown): body is ApiEnvelope<unknown> =>
    typeof body === 'object' && body !== null && 'success' in body && 'message' in body && 'data' in body;

export const axiosBaseQuery =
    (
        { baseUrl }: { baseUrl: string } = { baseUrl: '' }
    ): BaseQueryFn<
        {
            url: string;
            method?: AxiosRequestConfig['method'];
            data?: AxiosRequestConfig['data'];
            params?: AxiosRequestConfig['params'];
            headers?: AxiosRequestConfig['headers'];
            /** Return the whole envelope ({ message, data, ... }) instead of only `data`. */
            envelope?: boolean;
        },
        unknown,
        unknown
    > =>
        async ({ url, method, data, params, headers, envelope }) => {
            try {
                const result = await axiosInstance({
                    url: baseUrl + url,
                    method,
                    data,
                    params,
                    headers,
                });
                const body: unknown = result.data;
                if (envelope) return { data: body };
                // Standard envelope -> its `data` (which may legitimately be null); raw bodies as-is
                return { data: isEnvelope(body) ? body.data : body };
            } catch (axiosError) {
                const err = axiosError as AxiosError;
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };
