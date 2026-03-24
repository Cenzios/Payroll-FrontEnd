import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface ManageSalaryModalProps {
    manageModal: {
        type: "allowance" | "deduction";
        empId: string;
    } | null;
    modalEntries: { type: string; amount: number }[];
    setModalEntries: Dispatch<SetStateAction<{ type: string; amount: number }[]>>;
    onSave: () => void;
    onCancel: () => void;
}

const ManageSalaryModal = ({
    manageModal,
    modalEntries,
    setModalEntries,
    onSave,
    onCancel,
}: ManageSalaryModalProps) => {
    if (!manageModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onCancel} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {manageModal.type === "allowance"
                            ? "Manage Allowances"
                            : "Manage Deductions"}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 space-y-3">
                        {modalEntries.map((entry, idx) => {
                            const isLastRow = idx === modalEntries.length - 1;
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={entry.type}
                                        onChange={(e) => {
                                            const updated = [...modalEntries];
                                            updated[idx] = {
                                                ...updated[idx],
                                                type: e.target.value,
                                            };
                                            setModalEntries(updated);
                                        }}
                                        placeholder={
                                            isLastRow
                                                ? `Add Extra ${manageModal.type === "allowance" ? "Allowance" : "Deduction"}`
                                                : ""
                                        }
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300"
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount || ""}
                                        onChange={(e) => {
                                            const updated = [...modalEntries];
                                            updated[idx] = {
                                                ...updated[idx],
                                                amount: parseFloat(e.target.value) || 0,
                                            };
                                            setModalEntries(updated);
                                        }}
                                        placeholder="15,000.00"
                                        className="w-32 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300"
                                        min="0"
                                        step="0.01"
                                    />
                                    {isLastRow ? (
                                        /* Plus button for the last row */
                                        <button
                                            onClick={() =>
                                                setModalEntries((prev) => [
                                                    ...prev,
                                                    { type: "", amount: 0 },
                                                ])
                                            }
                                            className="shrink-0 w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <line
                                                    x1="8"
                                                    y1="12"
                                                    x2="16"
                                                    y2="12"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                                <line
                                                    x1="12"
                                                    y1="8"
                                                    x2="12"
                                                    y2="16"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </button>
                                    ) : (
                                        /* Minus button for existing rows */
                                        <button
                                            onClick={() =>
                                                setModalEntries((prev) =>
                                                    prev.filter((_, i) => i !== idx),
                                                )
                                            }
                                            className="shrink-0 w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <line
                                                    x1="8"
                                                    y1="12"
                                                    x2="16"
                                                    y2="12"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageSalaryModal;
