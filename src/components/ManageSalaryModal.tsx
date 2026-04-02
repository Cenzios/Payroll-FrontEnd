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

    const isAllowance = manageModal.type === "allowance";

    // Total of all valid entries (excluding the empty last row)
    const total = modalEntries
        .slice(0, -1)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
                        const canAdd = entry.type.trim() && entry.amount > 0;

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
                                        value={entry.amount || ""}
                                        onChange={(e) => {
                                            const updated = [...modalEntries];
                                            updated[idx] = {
                                                ...updated[idx],
                                                amount: parseFloat(e.target.value) || 0,
                                            };
                                            setModalEntries(updated);
                                        }}
                                        placeholder="0.00"
                                        className="w-28 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 outline-none bg-transparent text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                {/* Action button */}
                                {isLastRow ? (
                                    <button
                                        onClick={() => {
                                            if (canAdd) {
                                                setModalEntries((prev) => [
                                                    ...prev,
                                                    { type: "", amount: 0 },
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
                            LKR {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
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
                        className="px-8 py-2.5 bg-[#4282ff] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageSalaryModal;