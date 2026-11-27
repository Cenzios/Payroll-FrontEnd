/**
 * Name rules shared by every form (signup, settings, employee drawer, company forms).
 * Same rules as the API (Payroll-backEnd src/validations/name.validation.ts).
 *
 * Names as written on NIC / bank records: Unicode letters and combining marks (Sinhala,
 * Tamil, Latin...), plus ZWJ/ZWNJ used inside Sinhala conjuncts (e.g. ශ්‍රී).
 */
import { normalizeText } from "./textNormalize";

const PERSON_NAME_CHARS = /^[\p{L}\p{M}‌‍ .'’-]+$/u;
const COMPANY_NAME_CHARS = /^[\p{L}\p{M}\p{N}‌‍ .,'’&()/-]+$/u;
const HAS_LETTER = /\p{L}/u;

export const PERSON_NAME_MAX = 100;
export const COMPANY_NAME_MAX = 100;
export const ACCOUNT_HOLDER_NAME_MAX = 100;

const personNameMessage = (label: string, max: number): string =>
    `${label} can contain letters (any language, including Sinhala and Tamil), spaces, dots (.), hyphens (-) and apostrophes ('), 2-${max} characters`;

export const COMPANY_NAME_MESSAGE =
    `Company name can contain letters (any language), numbers, spaces and . , & ( ) / - ' (e.g. "ABC Traders (Pvt) Ltd"), 2-${COMPANY_NAME_MAX} characters`;

/** '' when valid, otherwise the message to show (says what IS allowed). */
export const personNameError = (value: string | undefined | null, label = "Full name", max = PERSON_NAME_MAX): string => {
    const name = normalizeText(value);
    if (!name) return `${label} is required`;
    if (name.length < 2 || name.length > max || !PERSON_NAME_CHARS.test(name) || !HAS_LETTER.test(name)) {
        return personNameMessage(label, max);
    }
    return "";
};

/** '' when valid, otherwise the message to show (says what IS allowed). */
export const companyNameError = (value: string | undefined | null): string => {
    const name = normalizeText(value);
    if (!name) return "Company name is required";
    if (name.length < 2 || name.length > COMPANY_NAME_MAX || !COMPANY_NAME_CHARS.test(name) || !HAS_LETTER.test(name)) {
        return COMPANY_NAME_MESSAGE;
    }
    return "";
};
