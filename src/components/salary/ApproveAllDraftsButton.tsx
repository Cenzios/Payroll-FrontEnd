import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';

interface ApproveAllDraftsButtonProps {
    draftCount: number;
    periodLabel: string;
    busy: boolean;
    onApproveAll: () => Promise<void>;
}

/** "Approve all drafts" for the selected month, with an in-page confirmation. */
const ApproveAllDraftsButton = ({ draftCount, periodLabel, busy, onApproveAll }: ApproveAllDraftsButtonProps): JSX.Element => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const noun = draftCount === 1 ? 'salary' : 'salaries';

    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-800 mb-2">Drafts ({draftCount})</label>
            <button
                type="button"
                data-testid="approve-all-drafts"
                disabled={draftCount === 0 || busy}
                onClick={() => setIsConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                <CheckCheck className="w-4 h-4" /> Approve all drafts
            </button>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    void onApproveAll().then(() => setIsConfirmOpen(false));
                }}
                isLoading={busy}
                type="warning"
                title={`Approve ${draftCount} draft ${noun}?`}
                message={`Every draft salary for ${periodLabel} is approved and locked. They can no longer be edited, regenerated or voided, and they are included in Bank Advice, EPF/ETF, C-Form and payslip downloads.`}
                confirmText="Approve all"
            />
        </div>
    );
};

export default ApproveAllDraftsButton;
