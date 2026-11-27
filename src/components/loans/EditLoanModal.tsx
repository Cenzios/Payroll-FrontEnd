import { useState } from 'react';
import type { Loan } from '../../store/apiSlice';
import { useUpdateLoanMutation, type LoanEditRequest } from '../../store/loanChangeApi';
import { sanitizeMoneyInput, toDecimal, toDecimalString } from '../../utils/money';
import LoanModalShell from './LoanModalShell';
import LoanField, { loanInputClass } from './LoanField';
import { readApiError, type ApiFormError } from './loanApiError';

interface EditLoanModalProps {
    loan: Loan;
    companyId: string;
    onClose: () => void;
    onDone: (message: string) => void;
}

interface EditForm {
    loanTitle: string;
    description: string;
    amount: string;
    interestRate: string;
    interestRateType: 'MONTHLY' | 'ANNUALLY';
    installmentCount: string;
    startDate: string;
    reason: string;
}

const formOf = (loan: Loan): EditForm => ({
    loanTitle: loan.loanTitle,
    description: loan.description ?? '',
    amount: toDecimalString(loan.amount),
    interestRate: toDecimalString(loan.interestRate),
    interestRateType: loan.interestRateType,
    installmentCount: String(loan.installmentCount),
    startDate: loan.startDate.slice(0, 10),
    reason: '',
});

/** Only the fields that changed are sent (the API logs one history row per changed field). */
const changedFields = (loan: Loan, f: EditForm): LoanEditRequest => {
    const o = formOf(loan);
    const body: LoanEditRequest = {};
    if (f.loanTitle.trim() !== o.loanTitle) body.loanTitle = f.loanTitle.trim();
    if (f.description.trim() !== o.description) body.description = f.description.trim() || null;
    if (!toDecimal(f.amount).equals(toDecimal(o.amount))) body.amount = f.amount;
    if (!toDecimal(f.interestRate).equals(toDecimal(o.interestRate))) body.interestRate = f.interestRate;
    if (f.interestRateType !== o.interestRateType) body.interestRateType = f.interestRateType;
    if (f.installmentCount !== o.installmentCount) body.installmentCount = Number(f.installmentCount);
    if (f.startDate !== o.startDate) body.startDate = f.startDate;
    if (f.reason.trim()) body.reason = f.reason.trim();
    return body;
};

/**
 * Edit a loan. Title and description can always change; amount, rate, rate type, instalment
 * count and start date only while the loan is ACTIVE, and then the API recalculates the
 * unpaid instalments (paid ones never change).
 */
const EditLoanModal = ({ loan, companyId, onClose, onDone }: EditLoanModalProps): JSX.Element => {
    const [form, setForm] = useState<EditForm>(() => formOf(loan));
    const [error, setError] = useState<ApiFormError | null>(null);
    const [updateLoan, { isLoading }] = useUpdateLoanMutation();
    const termsLocked = loan.status !== undefined && loan.status !== 'ACTIVE';
    const set = (key: keyof EditForm, value: string): void => setForm((prev) => ({ ...prev, [key]: value }));
    const setMoney = (key: 'amount' | 'interestRate', raw: string): void => {
        const value = sanitizeMoneyInput(raw, 9);
        if (value !== null) set(key, value);
    };

    const submit = async (): Promise<void> => {
        setError(null);
        try {
            const result = await updateLoan({ id: loan.id, companyId, data: changedFields(loan, form) }).unwrap();
            onDone(result.message);
        } catch (e) {
            setError(readApiError(e, 'Failed to update the loan'));
        }
    };

    return (
        <LoanModalShell
            title={`Edit loan ${loan.loanId}`}
            subtitle={termsLocked
                ? `This loan is ${loan.status?.toLowerCase()}: only the title and description can change.`
                : 'Changing the terms recalculates the unpaid instalments. Paid instalments never change.'}
            error={error?.message}
            busy={isLoading}
            confirmText="Save changes"
            onClose={onClose}
            onConfirm={() => { void submit(); }}
        >
            <LoanField label="Loan title" error={error?.fields.loanTitle}>
                <input className={loanInputClass} value={form.loanTitle} onChange={(e) => set('loanTitle', e.target.value)} />
            </LoanField>
            <LoanField label="Description" error={error?.fields.description}>
                <input className={loanInputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </LoanField>
            <div className="grid grid-cols-2 gap-3">
                <LoanField label="Amount (Rs.)" error={error?.fields.amount}>
                    <input className={loanInputClass} inputMode="decimal" disabled={termsLocked} value={form.amount} onChange={(e) => setMoney('amount', e.target.value)} />
                </LoanField>
                <LoanField label="Instalments" error={error?.fields.installmentCount}>
                    <input className={loanInputClass} inputMode="numeric" disabled={termsLocked} value={form.installmentCount}
                        onChange={(e) => set('installmentCount', e.target.value.replace(/[^0-9]/g, ''))} />
                </LoanField>
                <LoanField label="Interest rate (%)" error={error?.fields.interestRate}>
                    <input className={loanInputClass} inputMode="decimal" disabled={termsLocked} value={form.interestRate} onChange={(e) => setMoney('interestRate', e.target.value)} />
                </LoanField>
                <LoanField label="Rate type" error={error?.fields.interestRateType}>
                    <select className={loanInputClass} disabled={termsLocked} value={form.interestRateType}
                        onChange={(e) => set('interestRateType', e.target.value)}>
                        <option value="ANNUALLY">Annually</option>
                        <option value="MONTHLY">Monthly</option>
                    </select>
                </LoanField>
            </div>
            <LoanField label="Start date" error={error?.fields.startDate}>
                <input type="date" className={loanInputClass} disabled={termsLocked} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </LoanField>
            <LoanField label="Reason (optional, shown in the history)" error={error?.fields.reason}>
                <input className={loanInputClass} value={form.reason} onChange={(e) => set('reason', e.target.value)} />
            </LoanField>
        </LoanModalShell>
    );
};

export default EditLoanModal;
