import type { SalaryStatus } from '../../types/salary.types';

/** Draft (amber) / Approved (green) pill for a saved salary. */
const SalaryStatusBadge = ({ status }: { status: SalaryStatus }): JSX.Element => (
    <span
        data-testid="salary-status-badge"
        className={`px-3 py-1 rounded-full text-[12px] font-bold border max-sm:text-[10px] max-sm:px-2
            ${status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'}`}
    >
        {status === 'APPROVED' ? 'Approved' : 'Draft'}
    </span>
);

export default SalaryStatusBadge;
