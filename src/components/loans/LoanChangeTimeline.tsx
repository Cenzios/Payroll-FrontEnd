import { History } from 'lucide-react';
import type { Loan, LoanChangeLog } from '../../store/apiSlice';
import { formatRs, toDecimalString } from '../../utils/money';
import { formatDate, formatDateTime } from '../../utils/dateFormat';

interface LoanChangeTimelineProps {
    loan: Loan;
}

const FIELD_LABELS: Record<string, string> = {
    loanTitle: 'Title',
    description: 'Description',
    amount: 'Loan amount',
    interestRate: 'Interest rate',
    interestRateType: 'Rate type',
    installmentCount: 'Number of instalments',
    startDate: 'Start date',
    monthlyPremium: 'Monthly premium',
};

const MONEY_FIELDS = new Set(['amount', 'monthlyPremium', 'settledAmount']);

/** A raw history value formatted for its field: Rs. money, % rates, dates, labels. */
const formatValue = (field: string | null, value: string | null): string => {
    if (value === null || value === '') return '(empty)';
    if (field && MONEY_FIELDS.has(field)) return formatRs(value);
    if (field === 'interestRate') return `${toDecimalString(value)}%`;
    if (field === 'startDate') return formatDate(value);
    if (field === 'interestRateType') return value === 'ANNUALLY' ? 'Annually' : 'Monthly';
    return value;
};

const METHOD_LABELS: Record<string, string> = { CASH: 'cash', BANK_TRANSFER: 'bank transfer' };

/** One sentence per history row, e.g. "Interest rate changed from 12% to 10%". */
const describe = (log: LoanChangeLog, loan: Loan): string => {
    switch (log.action) {
        case 'CREATE':
            return `Loan created for ${formatValue('amount', log.newValue)}`;
        case 'SETTLE': {
            const method = loan.settlementMethod ? ` (${METHOD_LABELS[loan.settlementMethod]})` : '';
            const differs = log.oldValue && log.newValue && log.oldValue !== log.newValue
                ? `; outstanding principal was ${formatValue('settledAmount', log.oldValue)}` : '';
            return `Settled early for ${formatValue('settledAmount', log.newValue)}${method}${differs}`;
        }
        case 'CANCEL':
            return 'Loan cancelled';
        default: {
            const label = FIELD_LABELS[log.field ?? ''] ?? log.field ?? 'Field';
            return `${label} changed from ${formatValue(log.field, log.oldValue)} to ${formatValue(log.field, log.newValue)}`;
        }
    }
};

/** Loan change history, newest first: who changed what, when, and why. */
const LoanChangeTimeline = ({ loan }: LoanChangeTimelineProps): JSX.Element => {
    const logs = loan.changeLogs ?? [];
    return (
        <div className="border rounded-2xl p-4 mt-4 max-sm:mx-5" data-testid="loan-change-timeline">
            <h3 className="text-lg font-bold text-[#141B3B] mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" /> Change history
            </h3>
            {logs.length === 0 ? (
                <p className="text-[13px] text-gray-400">No changes recorded for this loan.</p>
            ) : (
                <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                    {logs.map((log) => (
                        <li key={log.id} className="ml-4">
                            <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full
                                ${log.action === 'SETTLE' ? 'bg-emerald-500' : log.action === 'CANCEL' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            <p className="text-[13px] text-gray-800">
                                <span className="font-semibold">{describe(log, loan)}</span>
                                {' '}by {log.changedBy?.fullName ?? 'a deleted user'} on {formatDateTime(log.changedAt)}
                            </p>
                            {log.reason && <p className="text-[12px] text-gray-500 mt-0.5">Reason: {log.reason}</p>}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

export default LoanChangeTimeline;
