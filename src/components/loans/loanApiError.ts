/** Message and per-field messages from an API error envelope (422 carries errors[]). */
export interface ApiFormError {
    message: string;
    fields: Record<string, string>;
}

export function readApiError(error: unknown, fallback: string): ApiFormError {
    const data = (error as { data?: { message?: string; errors?: { field: string; message: string }[] } } | null)?.data;
    const fields: Record<string, string> = {};
    for (const e of data?.errors ?? []) {
        if (!fields[e.field]) fields[e.field] = e.message;
    }
    return { message: data?.message || fallback, fields };
}
