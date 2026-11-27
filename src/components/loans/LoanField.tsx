import type { ReactNode } from 'react';

interface LoanFieldProps {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}

export const loanInputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400';

/** Labelled form row with the API's field error under it. */
const LoanField = ({ label, error, hint, children }: LoanFieldProps): JSX.Element => (
    <label className="block">
        <span className="block text-[13px] font-medium text-gray-700 mb-1">{label}</span>
        {children}
        {hint && !error && <span className="block text-[12px] text-gray-400 mt-1">{hint}</span>}
        {error && <span className="block text-[12px] text-red-600 mt-1">{error}</span>}
    </label>
);

export default LoanField;
