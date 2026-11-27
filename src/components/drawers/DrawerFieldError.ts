/**
 * Thrown by a drawer's onSubmit handler when the API rejected one specific field
 * (e.g. 409 duplicate company name). The drawer shows `message` under that field
 * and stays open with everything the user typed.
 */
export class DrawerFieldError extends Error {
    public readonly field: string;

    constructor(field: string, message: string) {
        super(message);
        this.name = "DrawerFieldError";
        this.field = field;
    }
}

interface ApiErrorShape {
    status?: number;
    data?: { message?: string };
}

/** 409 from POST/PUT /company: the user already owns a company with this name. */
export const companyNameConflict = (error: unknown): DrawerFieldError | null => {
    const e = error as ApiErrorShape | null;
    if (e && typeof e === "object" && e.status === 409) {
        return new DrawerFieldError("name", e.data?.message || "You already have a company with this name");
    }
    return null;
};
