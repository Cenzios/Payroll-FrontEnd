import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

interface LoanModalShellProps {
    title: string;
    subtitle?: string;
    error?: string | null;
    busy: boolean;
    confirmText: string;
    tone?: 'primary' | 'danger';
    onClose: () => void;
    onConfirm: () => void;
    children: ReactNode;
}

/** In-page dialog used by the loan Edit / Settle / Cancel actions (no window.confirm). */
const LoanModalShell = ({
    title, subtitle, error, busy, confirmText, tone = 'primary', onClose, onConfirm, children,
}: LoanModalShellProps): JSX.Element => createPortal(
    <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
    >
        <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-3">{children}</div>
            {error && <p className="mt-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">{error}</p>}
            <div className="flex gap-3 mt-5">
                <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50">
                    Close
                </button>
                <button
                    onClick={onConfirm}
                    disabled={busy}
                    className={`flex-1 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70
                        ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmText}
                </button>
            </div>
        </div>
    </div>,
    document.body,
);

export default LoanModalShell;
