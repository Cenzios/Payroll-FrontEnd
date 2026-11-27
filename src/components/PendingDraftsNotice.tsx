const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

/** "October 2026" for the month `offset` months from now (0 = this month, -1 = last month). */
const monthLabel = (offset: number): string => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1).toLocaleDateString('en-US', MONTH_FORMAT);
};

const draftsSentence = (count: number, month: string): string =>
    `${count} draft salar${count === 1 ? 'y' : 'ies'} for ${month} ${count === 1 ? 'is' : 'are'} not approved yet.`;

interface PendingDraftsNoticeProps {
    /** Drafts of the month the stat cards show (last month). */
    cardMonthDrafts: number;
    /** Drafts of the current month (not in any card yet). */
    currentMonthDrafts: number;
}

/**
 * Dashboard notice for unapproved salaries. Every line names its month: the cards show last
 * month's approved totals, so its drafts are the ones missing from them; this month's drafts
 * are listed separately.
 */
const PendingDraftsNotice = ({ cardMonthDrafts, currentMonthDrafts }: PendingDraftsNoticeProps): JSX.Element | null => {
    if (cardMonthDrafts <= 0 && currentMonthDrafts <= 0) return null;
    const cardMonth = monthLabel(-1);
    return (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" data-testid="dashboard-pending-drafts">
            {cardMonthDrafts > 0 && (
                <p>{draftsSentence(cardMonthDrafts, cardMonth)} The {cardMonth} totals above only include approved salaries.</p>
            )}
            {currentMonthDrafts > 0 && (
                <p>{draftsSentence(currentMonthDrafts, monthLabel(0))} Approve them on the Salary page.</p>
            )}
        </div>
    );
};

export default PendingDraftsNotice;
