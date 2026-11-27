import type { Loan } from '../../store/apiSlice';
import { formatDate } from '../../utils/dateFormat';
import { formatRs } from '../../utils/money';

interface LoanAmountNoteProps {
    loan: Pick<Loan, 'status' | 'settledAmount' | 'settledAt'>;
}

/**
 * Line under a loan's amount: a settled loan shows what was paid to close it (and when);
 * a cancelled loan says it is not counted in the Total Loan Amount.
 */
const LoanAmountNote = ({ loan }: LoanAmountNoteProps): JSX.Element | null => {
    if (loan.status === 'SETTLED' && loan.settledAmount) {
        return (
            <p className="text-[11px] text-[#A8B0B9] font-medium mt-0.5">
                Settled for {formatRs(loan.settledAmount)}{loan.settledAt ? ` on ${formatDate(loan.settledAt)}` : ''}
            </p>
        );
    }
    if (loan.status === 'CANCELLED') {
        return <p className="text-[11px] text-[#A8B0B9] font-medium mt-0.5">Cancelled - not counted in totals</p>;
    }
    return null;
};

export default LoanAmountNote;
