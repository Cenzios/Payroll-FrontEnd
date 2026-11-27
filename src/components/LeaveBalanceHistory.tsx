import { useAppSelector } from '../store/hooks';
import { useGetEmployeeLeaveHistoryQuery } from '../store/leaveApi';

interface LeaveBalanceHistoryProps {
    employeeId: string;
}

/**
 * Remaining paid leave per calendar year. Each year starts with the full annual entitlement
 * (nothing carries over); used = paid leave in that year's salaries, drafts included.
 */
const LeaveBalanceHistory = ({ employeeId }: LeaveBalanceHistoryProps): JSX.Element | null => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const { data: rows, isLoading } = useGetEmployeeLeaveHistoryQuery(
        { companyId: selectedCompanyId || '', employeeId },
        { skip: !selectedCompanyId || !employeeId },
    );

    if (isLoading) {
        return <p className="text-[12px] text-gray-400">Loading leave balance…</p>;
    }
    if (!rows || rows.length === 0) return null;

    return (
        <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden" data-testid="leave-balance-history">
            <table className="w-full text-[12px]">
                <thead className="bg-gray-50 text-[#8B98A8]">
                    <tr>
                        <th className="text-left font-semibold px-3 py-1.5">Year</th>
                        <th className="text-right font-semibold px-3 py-1.5">Entitled</th>
                        <th className="text-right font-semibold px-3 py-1.5">Used</th>
                        <th className="text-right font-semibold px-3 py-1.5">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.year} className="border-t border-gray-100 text-gray-800">
                            <td className="px-3 py-1.5 font-semibold">{row.year}</td>
                            <td className="px-3 py-1.5 text-right">{row.entitlement}d</td>
                            <td className="px-3 py-1.5 text-right">{row.used}d</td>
                            <td className={`px-3 py-1.5 text-right font-bold ${row.remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {row.remaining}d
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeaveBalanceHistory;
