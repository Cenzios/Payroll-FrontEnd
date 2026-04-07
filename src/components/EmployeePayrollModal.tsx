import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { exportEmployeeModalReport } from '../utils/exportService';
import { useGetCompaniesQuery } from '../store/apiSlice';
import Toast from './Toast';

interface EmployeePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    companyId: string;
    month: number;
    year: number;
}

interface MonthlyData {
    month: string;
    workedDays: number;
    companyWorkingDays?: number;
    basicPay: number;
    otHours: number;
    otAmount: number;
    grossPay: number;
    netPay: number;
    tax: number;
    salaryAdvance: number;
    deductions: number;
    employeeEPF: number;
    companyEPFETF: number;
    loanDeduction?: number;
    allowances?: { type: string; amount: number }[];
    customDeductions?: { type: string; amount: number }[];
}

interface EmployeeData {
    employeeName: string;
    employeeCode: string;
    designation: string;
    salaryType?: string;
    basicSalary: number;
    joinedDate: string;
    monthlyBreakdown: MonthlyData[];
    annualTotals: {
        workedDays: number;
        basicPay: number;
        otAmount: number;
        grossPay: number;
        netPay: number;
        tax: number;
        salaryAdvance: number;
        deductions: number;
        employeeEPF: number;
        companyEPFETF: number;
    };
}

const fmt = (val: number) =>
    `Rs. ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const EmployeePayrollModal = ({
    isOpen,
    onClose,
    employeeId,
    companyId,
    month,
    year,
}: EmployeePayrollModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { data: companies } = useGetCompaniesQuery();

    useEffect(() => {
        if (isOpen && employeeId && companyId && month && year) {
            fetchEmployeeData();
        }
    }, [isOpen, employeeId, companyId, month, year]);

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            const response = await reportApi.getEmployeePayrollSummary(employeeId, companyId, month, year);
            const actualData = response.data || response;
            setEmployeeData(actualData);
        } catch (error: any) {
            setToast({
                message: error.response?.data?.message || 'Failed to fetch employee data',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (!employeeData || !row) return;

        const selectedCompany = companies?.find(c => c.id === companyId);
        const companyName = selectedCompany?.name || 'Company Name';
        const companyAddress = selectedCompany?.address || '';

        // Standard 15% breakdown: 12% EPF, 3% ETF
        const epf12 = row.companyEPFETF * (12 / 15);
        const etf3 = row.companyEPFETF * (3 / 15);

        const totalAllowances = (row.allowances || []).reduce((sum, a) => sum + a.amount, 0);

        exportEmployeeModalReport({
            companyName,
            companyAddress,
            employeeName: employeeData.employeeName,
            employeeId: employeeData.employeeCode,
            month: month,
            year: year,
            basicSalary: employeeData.basicSalary || row.basicPay,
            totalAllowances: totalAllowances,
            grossPay: row.grossPay,
            totalDeductions: row.deductions,
            netPay: row.netPay,
            workedDays: row.workedDays,
            salaryType: employeeData.salaryType || 'MONTHLY',
            otHours: row.otHours,
            otAmount: row.otAmount,
            epf8: row.employeeEPF,
            loanDeduction: row.loanDeduction || 0,
            salaryAdvance: row.salaryAdvance || 0
        });
    };

    if (!isOpen) return null;

    const row: MonthlyData | undefined = employeeData?.monthlyBreakdown?.[0];
    const totals = employeeData?.annualTotals;

    const monthLabels = employeeData?.monthlyBreakdown?.map(m => m.month) ?? [];
    const monthRangeLabel =
        monthLabels.length > 1
            ? `${monthLabels[0]} – ${monthLabels[monthLabels.length - 1]}`
            : monthLabels[0] ?? '';

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden">

                    <div className="flex items-center px-7 pt-6 pb-4 relative">

                        {/* Left - Name */}
                        <h2 className="text-xl font-bold text-gray-900">
                            {employeeData?.employeeName ?? '—'}
                        </h2>

                        {/* Center - Employee + Month */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            {(employeeData?.employeeCode || monthRangeLabel) && (
                                <p className="text-sm text-gray-400 text-center font-medium">
                                    {employeeData?.employeeCode && monthRangeLabel
                                        ? `${employeeData.employeeCode} - ${monthRangeLabel}`
                                        : employeeData?.employeeCode || monthRangeLabel}
                                </p>
                            )}
                        </div>

                        {/* Right - Close Button */}
                        <button
                            onClick={onClose}
                            className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* ── Summary Pills ── */}
                    <div className="flex gap-3 px-7 pb-5">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Net Pay</span>
                            <span className="text-sm font-bold text-blue-600 whitespace-nowrap ml-auto">
                                {totals ? fmt(totals.netPay) : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Gross Pay</span>
                            <span className="text-sm font-bold text-gray-800 whitespace-nowrap ml-auto">
                                {totals ? fmt(totals.grossPay) : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Deductions</span>
                            <span className="text-sm font-bold text-red-500 whitespace-nowrap ml-auto">
                                {totals ? `– ${fmt(totals.deductions)}` : '—'}
                            </span>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto px-7 pb-2 max-h-[60vh]">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : !employeeData || !row ? (
                            <div className="text-center py-16 text-gray-400 text-sm">No data available</div>
                        ) : (
                            <>
                                {/* EARNINGS */}
                                <div className="mb-5">
                                    {/* Section header row */}
                                    <div className="flex items-center justify-between py-2 mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Earnings</span>
                                        <span className="text-sm font-bold text-green-600">{fmt(row.grossPay)}</span>
                                    </div>

                                    {/* Table rows */}
                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        {/* Basic Salary */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                            <span className="text-sm font-medium text-gray-800 w-44">Basic salary</span>
                                            <span className="text-sm text-gray-400 flex-1 text-center">
                                                {row.workedDays} days
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 text-right w-36">
                                                {fmt(row.basicPay)}
                                            </span>
                                        </div>

                                        {/* Overtime */}
                                        {row.otAmount > 0 && (
                                            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                                <span className="text-sm font-medium text-gray-800 w-44">Overtime</span>
                                                <span className="text-sm text-gray-400 flex-1 text-center">
                                                    {row.otHours} hrs × Rs.{' '}
                                                    {row.otHours > 0
                                                        ? (row.otAmount / row.otHours).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                                        : '0.00'}
                                                    /hr
                                                </span>
                                                <span className="text-sm font-semibold text-gray-900 text-right w-36">
                                                    {fmt(row.otAmount)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Custom Allowances */}
                                        {row.allowances?.map((a, i) => (
                                            <div key={i} className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                                <span className="text-sm font-medium text-gray-800 w-44">{a.type}</span>
                                                <span className="text-sm text-gray-400 flex-1 text-center"></span>
                                                <span className="text-sm font-semibold text-gray-900 text-right w-36">
                                                    {fmt(a.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* DEDUCTIONS */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between py-2 mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deductions</span>
                                        <span className="text-sm font-bold text-red-500">– {fmt(row.deductions)}</span>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        {/* Employee EPF */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                            <span className="text-sm font-medium text-gray-800 w-44">Employee EPF</span>
                                            <span className="text-sm text-gray-400 flex-1 text-center">8% of basic salary</span>
                                            <span className="text-sm font-semibold text-red-500 text-right w-36">
                                                – {fmt(row.employeeEPF)}
                                            </span>
                                        </div>

                                        {/* Loan Deduction */}
                                        {(row.loanDeduction ?? 0) > 0 && (
                                            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                                <span className="text-sm font-medium text-gray-800 w-44">Loan deduction</span>
                                                <span className="text-sm text-gray-400 flex-1 text-center">Monthly instalment</span>
                                                <span className="text-sm font-semibold text-red-500 text-right w-36">
                                                    – {fmt(row.loanDeduction ?? 0)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Salary Advance */}
                                        {row.salaryAdvance > 0 && (
                                            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                                <span className="text-sm font-medium text-gray-800 w-44">Advance deduction</span>
                                                <span className="text-sm text-gray-400 flex-1 text-center">Salary advance recovery</span>
                                                <span className="text-sm font-semibold text-red-500 text-right w-36">
                                                    – {fmt(row.salaryAdvance)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Custom Deductions */}
                                        {row.customDeductions?.map((d, i) => (
                                            <div key={i} className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-0">
                                                <span className="text-sm font-medium text-gray-800 w-44">{d.type}</span>
                                                <span className="text-sm text-gray-400 flex-1 text-center"></span>
                                                <span className="text-sm font-semibold text-red-500 text-right w-36">
                                                    – {fmt(d.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Company EPF/ETF note */}
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-white mb-1">
                                    <span className="text-sm text-blue-500">
                                        Company EPF/ETF contribution (not deducted from employee)
                                    </span>
                                    <span className="text-sm font-semibold text-blue-600 ml-4 whitespace-nowrap">
                                        {fmt(row.companyEPFETF)}
                                    </span>
                                </div>

                                {/* Net Pay Row */}
                                <div className="flex items-center justify-between px-4 py-4 rounded-xl border border-gray-200 bg-white mt-3">
                                    <span className="text-base font-bold text-gray-800">Net pay</span>
                                    <span className="text-lg font-bold text-blue-600">{fmt(row.netPay)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Footer Buttons ── */}
                    <div className="px-7 py-5 border-t border-gray-100 mt-3">
                        <div>
                            <button
                                disabled={!employeeData}
                                onClick={handleExport}
                                className="w-full py-3.5 rounded-xl border border-green-500 hover:bg-green-50 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed text-green-600 text-sm font-semibold transition-colors"
                            >
                                Export Pay-slip
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-3">All values in LKR</p>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </>
    );
};

export default EmployeePayrollModal;