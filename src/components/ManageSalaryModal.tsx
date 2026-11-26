import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import type { SalaryEntry } from "../store/slices/salarySlice";
import { formatRs, isPositive, sumBy, toDecimal } from "../utils/money";

/** Accepts a non-negative decimal with at most 7 integer digits ("" allowed). */
const AMOUNT_PATTERN = /^\d{0,7}(\.\d*)?$/;

interface ManageSalaryModalProps {
    manageModal: {
        type: "allowance" | "deduction";
        empId: string;
    } | null;
    modalEntries: SalaryEntry[];
    setModalEntries: Dispatch<SetStateAction<SalaryEntry[]>>;
    onSave: () => void;
    onCancel: () => void;
    earningsLimit?: string; // Decimal string. For deduction: total deductions cannot exceed this
    /** When true, Save also stores the items as the employee's recurring items (default off). */
    saveAsRecurring: boolean;
    onSaveAsRecurringChange: (value: boolean) => void;
    /** False when the employee's allowance/deduction toggle is off: items cannot be saved as recurring. */
    canSaveAsRecurring: boolean;
}

const ManageSalaryModal = ({
    manageModal,
    modalEntries,
    setModalEntries,
    onSave,
    onCancel,
    earningsLimit,
    saveAsRecurring,
    onSaveAsRecurringChange,
    canSaveAsRecurring,
}: ManageSalaryModalProps): JSX.Element | null => {
    if (!manageModal) return null;

    const isAllowance = manageModal.type === "allowance";

    // Total of all valid entries (excluding the empty last row)
    const total = sumBy(modalEntries, (e) => e.amount);

    // Deduction limit check
    const deductionExceedsEarnings =
        !isAllowance &&
        earningsLimit !== undefined &&
        isPositive(earningsLimit) &&
        total.greaterThan(toDecimal(earningsLimit));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isAllowance ? "Manage Allowances" : "Manage Deduction"}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-4 space-y-3">
                    {modalEntries.map((entry, idx) => {
                        const isLastRow = idx === modalEntries.length - 1;
                        const canAdd = entry.type.trim() && isPositive(entry.amount);

                        return (
                            <div key={idx} className="flex items-center gap-3">
                                {/* Name + Amount pill */}
                                <div
                                    className={`flex flex-1 rounded-full overflow-hidden border ${isLastRow
                                        ? "border-dashed border-gray-300 bg-white"
                                        : "border-gray-200 bg-white shadow-sm"
                                        }`}
                                >
                                    <input
                                        type="text"
                                        value={entry.type}
                                        onChange={(e) => {
                                            const updated = [...modalEntries];
                                            updated[idx] = { ...updated[idx], type: e.target.value };
                                            setModalEntries(updated);
                                        }}
                                        placeholder={
                                            isLastRow
                                                ? `Add Extra ${isAllowance ? "Allowance" : "Deduction"}`
                                                : ""
                                        }
                                        className="flex-1 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 outline-none bg-transparent"
                                    />
                                    {/* Divider */}
                                    <div className="w-px bg-gray-200 my-2" />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Keep money as a decimal string; reject >7 integer digits / invalid input
                                            if (!AMOUNT_PATTERN.test(val)) return;
                                            const updated = [...modalEntries];
                                            updated[idx] = {
                                                ...updated[idx],
                                                amount: val,
                                            };
                                            setModalEntries(updated);
                                        }}
                                        placeholder="0.00"
                                        className="w-28 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 outline-none bg-transparent text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        step="0.01"
                                        onKeyDown={(e) => {
                                            if (['+', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                                        }}
                                    />
                                </div>

                                {/* Action button */}
                                {isLastRow ? (
                                    <button
                                        onClick={() => {
                                            if (canAdd) {
                                                setModalEntries((prev) => [
                                                    ...prev,
                                                    { type: "", amount: "" },
                                                ]);
                                            }
                                        }}
                                        disabled={!canAdd}
                                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${canAdd
                                            ? isAllowance
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-red-500 hover:bg-red-600 text-white"
                                            : isAllowance
                                                ? "bg-blue-300 text-white cursor-not-allowed"
                                                : "bg-red-300 text-white cursor-not-allowed"
                                            }`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            setModalEntries((prev) => prev.filter((_, i) => i !== idx))
                                        }
                                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Total Bar */}
                <div className="mx-6 mb-5">
                    <div
                        className={`flex items-center justify-between px-5 py-3.5 rounded-full ${isAllowance ? "bg-blue-50" : "bg-red-50"
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                className={`w-2.5 h-2.5 rounded-full ${isAllowance ? "bg-blue-500" : "bg-red-500"
                                    }`}
                            />
                            <span
                                className={`text-sm font-semibold ${isAllowance ? "text-[#4785ff]" : "text-red-600"
                                    }`}
                            >
                                {isAllowance ? "Total Monthly Allowances" : "Total Monthly Deduction"}
                            </span>
                        </div>
                        <span
                            className={`text-sm font-semibold ${isAllowance ? "text-[#4785ff]" : "text-red-600"
                                }`}
                        >
                            {formatRs(total)}
                        </span>
                    </div>

                    {/* Earnings limit warning for deductions */}
                    {deductionExceedsEarnings && (
                        <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
                            <p className="text-[12px] text-red-600 font-medium leading-snug">
                                Total deductions ({formatRs(total)}) cannot exceed total earnings ({formatRs(earningsLimit)})
                            </p>
                        </div>
                    )}
                </div>

                {/* Scope: this salary only unless explicitly saved as recurring */}
                <div className="mx-6 mb-4">
                    <label className={`flex items-start gap-2.5 select-none ${canSaveAsRecurring ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}>
                        <input
                            type="checkbox"
                            checked={canSaveAsRecurring && saveAsRecurring}
                            disabled={!canSaveAsRecurring}
                            onChange={(e) => onSaveAsRecurringChange(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-[13px] text-gray-700">
                            Also save as recurring for this employee
                            <span className="block text-[11px] text-gray-400">
                                {!canSaveAsRecurring
                                    ? "Applies to this salary only."
                                    : saveAsRecurring
                                        ? `These ${isAllowance ? "allowances" : "deductions"} will also apply to future months.`
                                        : "Unchecked: applies to this salary only."}
                            </span>
                        </span>
                    </label>
                    {!canSaveAsRecurring && (
                        <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            {isAllowance ? "Allowances" : "Deductions"} are turned off for this employee. To save recurring {isAllowance ? "allowances" : "deductions"}, first enable {isAllowance ? "allowances" : "deductions"} for the employee in Employees &rsaquo; Edit.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={deductionExceedsEarnings}
                        className={`px-8 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm ${
                            deductionExceedsEarnings
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-[#4282ff] hover:bg-blue-700"
                        }`}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageSalaryModal;