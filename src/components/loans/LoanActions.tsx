import { useState } from 'react';
import { Ban, HandCoins, Pencil } from 'lucide-react';
import type { Loan } from '../../store/apiSlice';
import { useCancelLoanMutation } from '../../store/loanChangeApi';
import EditLoanModal from './EditLoanModal';
import SettleLoanModal from './SettleLoanModal';
import LoanModalShell from './LoanModalShell';
import LoanField, { loanInputClass } from './LoanField';
import { readApiError } from './loanApiError';

interface LoanActionsProps {
    loan: Loan;
    companyId: string;
    onMessage: (message: string, type: 'success' | 'error') => void;
    compact?: boolean;
}

type OpenDialog = 'edit' | 'settle' | 'cancel' | null;

/**
 * Edit / Settle early / Cancel for one loan, each in an in-page dialog. Settle and Cancel are
 * only offered for ACTIVE loans; Cancel only while nothing has been paid.
 */
const LoanActions = ({ loan, companyId, onMessage, compact = false }: LoanActionsProps): JSX.Element => {
    const [open, setOpen] = useState<OpenDialog>(null);
    const [reason, setReason] = useState('');
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelLoan, { isLoading: isCancelling }] = useCancelLoanMutation();
    const isActive = (loan.status ?? 'ACTIVE') === 'ACTIVE';
    const nothingPaid = !(loan.installments ?? []).some((i) => i.status === 'PAID');
    const btn = `flex items-center gap-1.5 rounded-lg font-semibold transition-colors ${compact ? 'px-2 py-1 text-[12px]' : 'px-3 py-2 text-[13px]'}`;

    const done = (message: string): void => {
        setOpen(null);
        onMessage(message, 'success');
    };

    const confirmCancel = async (): Promise<void> => {
        setCancelError(null);
        try {
            const result = await cancelLoan({ id: loan.id, companyId, reason: reason.trim() || undefined }).unwrap();
            done(result.message);
        } catch (e) {
            setCancelError(readApiError(e, 'Failed to cancel the loan').message);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button className={`${btn} bg-gray-100 text-gray-800 hover:bg-gray-200`} onClick={() => setOpen('edit')}>
                <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            {isActive && (
                <button className={`${btn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`} onClick={() => setOpen('settle')}>
                    <HandCoins className="w-3.5 h-3.5" /> Settle early
                </button>
            )}
            {isActive && nothingPaid && (
                <button className={`${btn} bg-red-50 text-red-600 hover:bg-red-100`} onClick={() => { setReason(''); setCancelError(null); setOpen('cancel'); }}>
                    <Ban className="w-3.5 h-3.5" /> Cancel
                </button>
            )}

            {open === 'edit' && <EditLoanModal loan={loan} companyId={companyId} onClose={() => setOpen(null)} onDone={done} />}
            {open === 'settle' && <SettleLoanModal loan={loan} companyId={companyId} onClose={() => setOpen(null)} onDone={done} />}
            {open === 'cancel' && (
                <LoanModalShell
                    title={`Cancel loan ${loan.loanId}?`}
                    subtitle="Nothing has been paid on this loan. Its instalments are cancelled and will never be deducted."
                    error={cancelError}
                    busy={isCancelling}
                    confirmText="Cancel loan"
                    tone="danger"
                    onClose={() => setOpen(null)}
                    onConfirm={() => { void confirmCancel(); }}
                >
                    <LoanField label="Reason (optional, shown in the history)">
                        <input className={loanInputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
                    </LoanField>
                </LoanModalShell>
            )}
        </div>
    );
};

export default LoanActions;
