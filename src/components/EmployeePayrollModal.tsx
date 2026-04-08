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

                    {/* ── Summary Bar ── */}
                    <div className="grid grid-cols-3 border-b border-gray-100 pt-2 pb-6">
                        <div className="flex flex-col items-center border-r border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Pay</span>
                            <span className="text-[22px] font-bold text-blue-600">
                                {totals ? fmt(totals.netPay) : '—'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center border-r border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Pay</span>
                            <span className="text-[22px] font-bold text-gray-900">
                                {totals ? fmt(totals.grossPay) : '—'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deduction</span>
                            <span className="text-[22px] font-bold text-red-600">
                                {totals ? `-${fmt(totals.deductions)}` : '—'}
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
                                <div className="mt-4 mb-8">
                                    <div className="flex items-center justify-between py-2 mb-2">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Earnings</span>
                                        <span className="text-[15px] font-bold text-green-600">{fmt(row.grossPay)}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                        {/* Basic Salary */}
                                        <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-medium text-gray-900">Basic salary</span>
                                                <span className="text-[13px] text-gray-300 mt-0.5">
                                                    {row.workedDays} days X {fmt(row.basicPay / (row.workedDays || 1))}/day
                                                </span>
                                            </div>
                                            <span className="text-[15px] font-medium text-gray-900">
                                                {fmt(row.basicPay || 0)}
                                            </span>
                                        </div>

                                        {/* Overtime */}
                                        {row.otAmount > 0 && (
                                            <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-medium text-gray-900">Overtime</span>
                                                    <span className="text-[13px] text-gray-300 mt-0.5">
                                                        {row.otHours} hrs X {fmt((row.otAmount / (row.otHours || 1)))}/hr
                                                    </span>
                                                </div>
                                                <span className="text-[15px] font-medium text-gray-900">
                                                    {fmt(row.otAmount)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Custom Allowances */}
                                        {row.allowances?.map((a, i) => (
                                            <div key={i} className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                                <span className="text-[15px] font-medium text-gray-900">{a.type}</span>
                                                <span className="text-[15px] font-medium text-gray-900">
                                                    {fmt(a.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* DEDUCTIONS */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between py-2 mb-2">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Deductions</span>
                                        <span className="text-[15px] font-bold text-red-500">-{fmt(row.deductions)}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                        {/* Employee EPF */}
                                        <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-medium text-gray-900">Employee EPF</span>
                                                <span className="text-[13px] text-gray-300 mt-0.5">8% of basic salary</span>
                                            </div>
                                            <span className="text-[15px] font-medium text-red-600">
                                                -{fmt(row.employeeEPF)}
                                            </span>
                                        </div>

                                        {/* Loan Deduction */}
                                        {(row.loanDeduction ?? 0) > 0 && (
                                            <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-medium text-gray-900">Loan deduction</span>
                                                    <span className="text-[13px] text-gray-300 mt-0.5">Monthly instalment</span>
                                                </div>
                                                <span className="text-[15px] font-medium text-red-600">
                                                    -{fmt(row.loanDeduction ?? 0)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Salary Advance */}
                                        {row.salaryAdvance > 0 && (
                                            <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-medium text-gray-900">Advance deduction</span>
                                                    <span className="text-[13px] text-gray-300 mt-0.5">Salary advance recovery</span>
                                                </div>
                                                <span className="text-[15px] font-medium text-red-600">
                                                    -{fmt(row.salaryAdvance)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Custom Deductions */}
                                        {row.customDeductions?.map((d, i) => (
                                            <div key={i} className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
                                                <span className="text-[15px] font-medium text-gray-900">{d.type}</span>
                                                <span className="text-[15px] font-medium text-red-600">
                                                    -{fmt(d.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Company EPF/ETF note */}
                                <div className="flex items-center justify-between px-6 py-4 rounded-xl border border-blue-100 bg-blue-50/30 mb-6">
                                    <span className="text-[14px] font-medium text-blue-600">
                                        Company EPF/ETF contribution (not deducted from employee)
                                    </span>
                                    <span className="text-[15px] font-bold text-blue-600 ml-4 whitespace-nowrap">
                                        {fmt(row.companyEPFETF)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Footer Buttons ── */}
                    <div className="px-7 py-6 flex items-center justify-between">
                        <p className="text-[13px] text-gray-400 font-medium">All values in LKR</p>
                        <button
                            disabled={!employeeData}
                            onClick={handleExport}
                            className="px-8 py-3 rounded-xl border border-green-500/30 hover:bg-green-50 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed text-green-600 text-[15px] font-bold transition-all"
                        >
                            Export Pay-slip
                        </button>
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