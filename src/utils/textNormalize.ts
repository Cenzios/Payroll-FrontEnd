/**
 * Same canonical forms the API applies (Payroll-backEnd src/utils/textNormalize.ts),
 * so what the user sees after saving is exactly what was sent.
 */

/** Names, IDs and short labels: Unicode NFC, any run of whitespace -> one space, trimmed. */
export const normalizeText = (value: string | undefined | null): string =>
    (value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();

/** Email addresses: trimmed and lower-case. */
export const normalizeEmail = (value: string | undefined | null): string => (value ?? "").trim().toLowerCase();

/** Identifiers with no meaningful spaces (NIC, EPF number, account number): no whitespace, upper-case. */
export const normalizeCompact = (value: string | undefined | null): string =>
    (value ?? "").replace(/\s+/g, "").toUpperCase();
