import { AlertTriangle } from 'lucide-react';
import { formatRs } from '../utils/money';

/** Blocking invoice returned by POST /payments/renew-monthly (money as decimal strings). */
export interface BlockingInvoice {
    id?: string;
    totalAmount: string;
    employeeCount?: number;
    billingMonth?: string;
    dueDate?: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days past the due date (0 when not yet due or no due date). */
export function daysOverdue(invoice: BlockingInvoice): number {
    if (!invoice.dueDate) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / MS_PER_DAY));
}

function formatDueDate(dueDate: string | undefined): string {
    return dueDate ? new Date(dueDate).toLocaleDateString('en-GB').replace(/\//g, '.') : '—';
}

function formatBillingMonth(billingMonth: string | undefined): string {
    return billingMonth
        ? new Date(`${billingMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';
}

interface InvoiceSummaryCardProps {
    invoice: BlockingInvoice;
}

/** Left-hand summary of the invoice being paid; wording follows the real due date. */
const InvoiceSummaryCard = ({ invoice }: InvoiceSummaryCardProps): JSX.Element => {
    const overdue = daysOverdue(invoice);
    const isOverdue = overdue > 0;
    const dueDate = formatDueDate(invoice.dueDate);
    const billingMonth = formatBillingMonth(invoice.billingMonth);
    const periodText = billingMonth ? `for the ${billingMonth} period ` : '';

    return (
        <div className="bg-white rounded-[2rem] shadow-xl border border-blue-50/50 p-10 flex flex-col space-y-8 h-fit">
            <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#B91C1C] text-sm font-bold border border-[#B91C1C]/20">
                    <span className="w-2 h-2 rounded-full bg-[#B91C1C]"></span>
                    {isOverdue ? 'Overdue – Action Required' : 'Payment Due'}
                </span>
            </div>

            <div className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 border border-[#B91C1C]/20 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="text-[#B91C1C] w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[#7F1D1D] leading-tight">
                        {isOverdue ? 'Payment Overdue – Immediate Action Required' : 'Payment Required'}
                    </h2>
                    <p className="text-gray-500 mt-3 leading-relaxed text-[15px]">
                        {isOverdue
                            ? `Your payment ${periodText}was due on ${dueDate}. Please clear your outstanding balance to restore full access.`
                            : `Your payment ${periodText}is due${invoice.dueDate ? ` on ${dueDate}` : ''}. Please settle it to continue using the service.`}
                    </p>
                </div>
            </div>

            <div className="bg-[#FFF8F8] rounded-[1.5rem] p-8 flex justify-between items-end shadow-sm">
                <div className="space-y-1">
                    <p className="text-[#64748B] text-[15px] mb-2">Total Outstanding Balance</p>
                    <p className="text-[28px] font-semibold text-[#EF4444]">{formatRs(invoice.totalAmount)}</p>
                    {invoice.employeeCount !== undefined && (
                        <p className="text-[#64748B] text-[14px] mt-4 font-medium">
                            Payment for {invoice.employeeCount} employee(s){billingMonth ? ` in ${billingMonth}` : ''}.
                        </p>
                    )}
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-[#64748B] text-[15px] mb-2">Due Date</p>
                    <p className="text-base font-semibold text-[#8B2222]">{dueDate}</p>
                    {isOverdue && <p className="text-[#DC2626] text-[14px] mt-2">{overdue} days overdue</p>}
                </div>
            </div>
        </div>
    );
};

export default InvoiceSummaryCard;
