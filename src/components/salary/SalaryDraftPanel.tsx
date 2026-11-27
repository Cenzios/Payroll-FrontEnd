import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, CheckCircle2, FilePenLine, LockKeyhole, RefreshCw, Trash2 } from 'lucide-react';
import type { SalaryRecord } from '../../types/salary.types';
import { formatDateTime } from '../../utils/dateFormat';
import ConfirmationModal from '../ConfirmationModal';
import ApproveSalaryDialog from './ApproveSalaryDialog';
import SalaryStatusBadge from './SalaryStatusBadge';

interface SalaryDraftPanelProps {
    salary: SalaryRecord;
    employeeName: string;
    employeeCode: string;
    periodLabel: string;
    busy: boolean;
    onView: () => void;
    onEdit: () => void;
    onRegenerate: () => Promise<void>;
    onVoid: () => Promise<void>;
    onApprove: () => Promise<void>;
}

type PendingAction = 'approve' | 'regenerate' | 'void' | null;

const actionButton = 'flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[13px] transition-colors disabled:opacity-50';

/** Who approved it and when; legacy salaries (approved before drafts existed) have no approver. */
const approvalLine = (salary: SalaryRecord): string =>
    salary.approvedBy
        ? `Approved by ${salary.approvedBy.fullName} on ${formatDateTime(salary.approvedAt)}`
        : `Approved on ${formatDateTime(salary.approvedAt)}`;

/**
 * Status panel over a saved salary: an APPROVED salary is locked (view only); a DRAFT can be
 * viewed, edited, regenerated, voided or approved. Every confirmation is in-page.
 */
const SalaryDraftPanel = ({
    salary, employeeName, employeeCode, periodLabel, busy, onView, onEdit, onRegenerate, onVoid, onApprove,
}: SalaryDraftPanelProps): JSX.Element => {
    const [pending, setPending] = useState<PendingAction>(null);
    const isDraft = salary.status === 'DRAFT';

    const run = async (action: () => Promise<void>): Promise<void> => {
        await action();
        setPending(null);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#00000099]/40 backdrop-blur-[2px] rounded-b-2xl p-3">
            <div className="bg-white border border-gray-300 rounded-2xl shadow-2xl px-5 py-3 flex flex-col md:flex-row md:items-center gap-3 max-w-full">
                <div className="flex items-start gap-3">
                    {isDraft
                        ? <FilePenLine className="w-5 h-5 text-amber-500 mt-0.5" strokeWidth={2.5} />
                        : <LockKeyhole className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2.5} />}
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-bold text-gray-900 leading-tight">
                                {isDraft ? 'Draft salary' : 'Salary approved'}
                            </h4>
                            <SalaryStatusBadge status={salary.status} />
                        </div>
                        <p className="text-[12px] font-medium text-gray-600" data-testid="salary-status-line">
                            {isDraft
                                ? `Not approved yet${salary.updatedBy ? ` · last saved by ${salary.updatedBy.fullName}` : ''} on ${formatDateTime(salary.updatedAt ?? salary.createdAt)}`
                                : `${approvalLine(salary)} · locked`}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:ml-4">
                    <button onClick={(e) => { e.stopPropagation(); onView(); }} className={`${actionButton} bg-gray-100 text-gray-900 hover:bg-gray-200`}>
                        <ArrowUpRight className="w-4 h-4" /> {isDraft ? 'Preview' : 'View Pay-slip'}
                    </button>
                    {isDraft && (
                        <>
                            <button disabled={busy} onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`${actionButton} bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                                <FilePenLine className="w-4 h-4" /> Edit
                            </button>
                            <button disabled={busy} onClick={(e) => { e.stopPropagation(); setPending('regenerate'); }} className={`${actionButton} bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                                <RefreshCw className="w-4 h-4" /> Regenerate
                            </button>
                            <button disabled={busy} onClick={(e) => { e.stopPropagation(); setPending('void'); }} className={`${actionButton} bg-red-50 text-red-600 hover:bg-red-100`}>
                                <Trash2 className="w-4 h-4" /> Void
                            </button>
                            <button disabled={busy} onClick={(e) => { e.stopPropagation(); setPending('approve'); }} className={`${actionButton} bg-green-600 text-white hover:bg-green-700`}>
                                <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                        </>
                    )}
                </div>
            </div>

            {pending === 'approve' && (
                <ApproveSalaryDialog
                    employeeName={employeeName}
                    employeeCode={employeeCode}
                    periodLabel={periodLabel}
                    earnings={salary.grossSalary}
                    deductions={salary.totalDeduction}
                    netSalary={salary.netSalary}
                    busy={busy}
                    onCancel={() => setPending(null)}
                    onConfirm={() => { void run(onApprove); }}
                />
            )}
            {(pending === 'regenerate' || pending === 'void') && createPortal(
                <div onClick={(e) => e.stopPropagation()} className="relative z-[9999]">
                    <ConfirmationModal
                        isOpen
                        onClose={() => setPending(null)}
                        onConfirm={() => { void run(pending === 'void' ? onVoid : onRegenerate); }}
                        isLoading={busy}
                        type={pending === 'void' ? 'danger' : 'warning'}
                        title={pending === 'void' ? 'Void this draft?' : 'Regenerate this draft?'}
                        message={pending === 'void'
                            ? `The ${periodLabel} draft for ${employeeName} is deleted, its paid leave is freed and any loan instalment it held is released. You can generate the month again.`
                            : `The ${periodLabel} draft for ${employeeName} is recalculated from the employee's current pay, EPF rates and loan instalments. The days, OT, leave, allowances and deductions entered are kept.`}
                        confirmText={pending === 'void' ? 'Void draft' : 'Regenerate'}
                    />
                </div>,
                document.body,
            )}
        </div>
    );
};

export default SalaryDraftPanel;
