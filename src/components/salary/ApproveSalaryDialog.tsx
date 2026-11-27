import { createPortal } from 'react-dom';
import { Loader2, Lock } from 'lucide-react';
import { formatMoney, type MoneyInput } from '../../utils/money';

interface ApproveSalaryDialogProps {
    employeeName: string;
    employeeCode: string;
    periodLabel: string;
    earnings: MoneyInput;
    deductions: MoneyInput;
    netSalary: MoneyInput;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * In-page approval step (replaces the old "Confirm & Lock" dialog). Approving locks the
 * salary for good; it does not send anything to the employee.
 */
const ApproveSalaryDialog = ({
    employeeName, employeeCode, periodLabel, earnings, deductions, netSalary, busy, onCancel, onConfirm,
}: ApproveSalaryDialogProps): JSX.Element => createPortal(
    <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-salary-title"
    >
        <div className="bg-white rounded-[26px] p-6 w-full max-w-[460px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in duration-200">
            <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <h3 id="approve-salary-title" className="text-[18px] font-bold text-gray-900">Approve &amp; lock salary</h3>
                    <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">
                        Review the figures. Once approved, this salary can no longer be edited, regenerated or voided.
                    </p>
                </div>
            </div>

            <div className="bg-[#f6f9ff] border border-[#b9cdf7] rounded-2xl p-4 mb-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-[14px] font-semibold text-gray-900">{employeeName}</p>
                        <p className="text-[12px] text-gray-500">ID: {employeeCode}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-gray-400">Month</p>
                        <p className="text-[13px] font-semibold text-gray-900">{periodLabel}</p>
                    </div>
                </div>
                <div className="border-t border-[#b9cdf7] my-3" />
                <div className="flex justify-between text-[13px] mb-3">
                    <div>
                        <p className="text-gray-500">Earnings</p>
                        <p className="text-green-600 font-semibold">{formatMoney(earnings)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500">Deductions</p>
                        <p className="text-red-500 font-semibold">{formatMoney(deductions)}</p>
                    </div>
                </div>
                <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex justify-between items-center shadow-inner">
                    <span className="text-[13px] font-semibold tracking-wide">NET SALARY</span>
                    <span className="text-[15px] font-bold">{formatMoney(netSalary)}</span>
                </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-5">
                <span className="text-amber-500 text-lg leading-none">⚠</span>
                <p className="text-[12px] text-amber-700 leading-snug">
                    Approval is permanent. The salary is then included in Bank Advice, EPF/ETF, C-Form and the
                    payslip download, and any loan instalment it deducts is marked as paid.
                </p>
            </div>

            <div className="flex gap-3 text-sm">
                <button
                    onClick={onCancel}
                    disabled={busy}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={busy}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Approve &amp; lock
                </button>
            </div>
        </div>
    </div>,
    document.body,
);

export default ApproveSalaryDialog;
