import { useState } from 'react';
import type { Loan, SettlementMethod } from '../../store/apiSlice';
import { useSettleLoanMutation } from '../../store/loanChangeApi';
import { formatRs, sanitizeMoneyInput, toDecimal, toMoneyString } from '../../utils/money';
import LoanModalShell from './LoanModalShell';
import LoanField, { loanInputClass } from './LoanField';
import { readApiError, type ApiFormError } from './loanApiError';

interface SettleLoanModalProps {
    loan: Loan;
    companyId: string;
    onClose: () => void;
    onDone: (message: string) => void;
}

/** Today as YYYY-MM-DD in local time. */
const today = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Early settlement paid outside payroll. Defaults to the outstanding principal; a different
 * amount needs a reason. The unpaid instalments are closed and never deducted again.
 */
const SettleLoanModal = ({ loan, companyId, onClose, onDone }: SettleLoanModalProps): JSX.Element => {
    const outstanding = toMoneyString(loan.outstandingPrincipal ?? '0');
    const [amount, setAmount] = useState(outstanding);
    const [settledAt, setSettledAt] = useState(today());
    const [method, setMethod] = useState<SettlementMethod>('CASH');
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<ApiFormError | null>(null);
    const [settleLoan, { isLoading }] = useSettleLoanMutation();
    const amountChanged = !toDecimal(amount).equals(toDecimal(outstanding));

    const submit = async (): Promise<void> => {
        setError(null);
        if (amountChanged && !reason.trim()) {
            setError({ message: 'Give a reason for settling at a different amount.', fields: { reason: 'A reason is required when the amount differs from the outstanding principal' } });
            return;
        }
        try {
            const result = await settleLoan({
                id: loan.id,
                companyId,
                data: { amount: toMoneyString(amount), settledAt, method, note: note.trim() || undefined, reason: reason.trim() || undefined },
            }).unwrap();
            onDone(result.message);
        } catch (e) {
            setError(readApiError(e, 'Failed to settle the loan'));
        }
    };

    return (
        <LoanModalShell
            title={`Settle loan ${loan.loanId} early`}
            subtitle="Record a repayment made outside payroll. No further instalments will be deducted from salaries."
            error={error?.message}
            busy={isLoading}
            confirmText="Settle loan"
            onClose={onClose}
            onConfirm={() => { void submit(); }}
        >
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex justify-between items-center" data-testid="settle-outstanding">
                <span className="text-[13px] text-blue-800 font-medium">Outstanding principal</span>
                <span className="text-[16px] font-bold text-blue-900">{formatRs(outstanding)}</span>
            </div>
            <LoanField label="Settlement amount (Rs.)" error={error?.fields.amount}
                hint={amountChanged ? `Differs from the outstanding principal by ${formatRs(toDecimal(amount).minus(toDecimal(outstanding)))}` : undefined}>
                <input className={loanInputClass} inputMode="decimal" value={amount}
                    onChange={(e) => { const v = sanitizeMoneyInput(e.target.value, 9); if (v !== null) setAmount(v); }} />
            </LoanField>
            {amountChanged && (
                <LoanField label="Reason for the different amount (required)" error={error?.fields.reason}>
                    <input className={loanInputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
                </LoanField>
            )}
            <div className="grid grid-cols-2 gap-3">
                <LoanField label="Date received" error={error?.fields.settledAt}>
                    <input type="date" className={loanInputClass} max={today()} value={settledAt} onChange={(e) => setSettledAt(e.target.value)} />
                </LoanField>
                <LoanField label="Paid by" error={error?.fields.method}>
                    <select className={loanInputClass} value={method} onChange={(e) => setMethod(e.target.value as SettlementMethod)}>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank transfer</option>
                    </select>
                </LoanField>
            </div>
            <LoanField label="Note (optional)" error={error?.fields.note}>
                <input className={loanInputClass} value={note} placeholder="e.g. receipt or transfer reference" onChange={(e) => setNote(e.target.value)} />
            </LoanField>
        </LoanModalShell>
    );
};

export default SettleLoanModal;
