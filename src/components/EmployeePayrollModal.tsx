import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { X, Loader2 } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { exportPayslip } from '../utils/exportService';
import { useGetCompaniesQuery, useGetSalaryHistoryQuery } from '../store/apiSlice';
import Toast from './Toast';
import PayslipPreview from './PayslipPreview';
import type { EmployeeMonthlyRow, EmployeePayrollSummary } from '../types/report.types';
import type { SalaryDetails, SalaryRecord } from '../types/salary.types';
import { isPositive, toDecimal } from '../utils/money';
import { calculateDailyRate } from '../utils/salaryCalc';

interface EmployeePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    companyId: string;
    month: number;
    year: number;
}

// Report response shapes (money as decimal strings) live in types/report.types.ts
type MonthlyData = EmployeeMonthlyRow;
type EmployeeData = EmployeePayrollSummary;

/** EPF 12% / ETF 3% split of the combined 15% company contribution. */
const EMPLOYER_EPF_SHARE = new Decimal(12).dividedBy(15);
const ETF_SHARE = new Decimal(3).dividedBy(15);

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
    const { data: salaryHistoryResponse } = useGetSalaryHistoryQuery(
        { companyId, employeeId, month, year },
        { skip: !isOpen || !companyId || !employeeId || !month || !year }
    );

    useEffect(() => {
        if (isOpen && employeeId && companyId && month && year) {
            fetchEmployeeData();
        }
    }, [isOpen, employeeId, companyId, month, year]);

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            const response = await reportApi.getEmployeePayrollSummary(employeeId, companyId, month, year);
            setEmployeeData(response.data);
        } catch (error: any) {
            setToast({
                message: error.response?.data?.message || 'Failed to fetch employee data',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const row: MonthlyData | undefined = employeeData?.monthlyBreakdown?.[0];
    const rawSalary: SalaryRecord | undefined = salaryHistoryResponse?.[0];
    const selectedCompany = companies?.find(c => c.id === companyId);
    const companyName = selectedCompany?.name || 'Company Name';
    const companyAddress = selectedCompany?.address || '';

    // Data Mapper for PayslipPreview (money stays as decimal strings; maths via decimal.js)
    const getPayslipData = (): {
        previewPayslip: SalaryDetails;
        companyWorkingDays: number;
        selectedEmployee: { id: string; fullName: string; employeeId: string; designation: string };
    } | null => {
        if (!employeeData || !row) return null;

        // Use the saved companyWorkingDays from the report row (same value the Salary page used).
        // Never fall back to calendar days — that caused the mismatch with the Salary page payslip.
        const cWorkingDays =
            row.companyWorkingDays ||
            (
                (row.workedDays || 0) +
                (row.leaveDays || 0) +
                (row.sickLeaveDays || 0)
            );

        const actualSalaryType = row.salaryType || rawSalary?.salaryType || employeeData.salaryType || 'MONTHLY';
        const actualSickLeaveDays = row.sickLeaveDays || rawSalary?.sickLeaveDays || 0;
        const actualLeaveDays = row.leaveDays || rawSalary?.leaveDays || 0;

        const basicSalary = isPositive(employeeData.basicSalary) ? employeeData.basicSalary : row.basicPay;
        const nonPaidLeaveDeduction = isPositive(row.nonPaidLeaveDeduction)
            ? (row.nonPaidLeaveDeduction ?? '0')
            : actualSalaryType === 'MONTHLY' && cWorkingDays > 0
                ? toDecimal(basicSalary).dividedBy(cWorkingDays).times(actualSickLeaveDays).toFixed(4)
                : '0';

        const payslipDeductions = [
            ...(row.customDeductions || []).map(d => ({ name: d.type, amount: d.amount })),
            ...(isPositive(row.salaryAdvance) ? [{ name: 'Salary Advance', amount: row.salaryAdvance }] : []),
        ];

        const companyEPFETF = toDecimal(row.companyEPFETF);
        const epf12 = companyEPFETF.times(EMPLOYER_EPF_SHARE).toFixed(4);
        const etf3 = companyEPFETF.times(ETF_SHARE).toFixed(4);

        return {
            previewPayslip: {
                salaryType: row.salaryType || employeeData.salaryType || 'MONTHLY',
                basicSalary,
                workedDays: row.workedDays,
                basicPay: row.basicPay,
                otAmount: row.otAmount,
                otHours: row.otHours,
                allowances: (row.allowances || []).map(a => ({ name: a.type, amount: a.amount })),
                isEpfEnabled: isPositive(row.employeeEPF),
                epf8: row.employeeEPF,
                epfEmployee: row.employeeEPF,
                epfEmployer: epf12,
                etfEmployer: etf3,
                loanDeduction: row.loanDeduction || '0',
                salaryAdvance: row.salaryAdvance,
                deductions: payslipDeductions,
                totalDeductions: row.deductions,
                netSalary: row.netPay,
                epf12,
                etf3,
                paidLeave: actualLeaveDays,
                dailyRate: calculateDailyRate(actualSalaryType, basicSalary, cWorkingDays).toFixed(4),
                leaveDays: actualLeaveDays,
                sickLeaveDays: actualSickLeaveDays,
                nonPaidLeaveDeduction,
            },
            companyWorkingDays: cWorkingDays,
            selectedEmployee: {
                id: employeeId,
                fullName: employeeData.employeeName,
                employeeId: employeeData.employeeCode,
                designation: employeeData.designation
            }
        };
    };

    const payslipData = getPayslipData();

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
        if (!payslipData) return;

        exportPayslip(format, {
            previewPayslip: payslipData.previewPayslip,
            selectedEmployee: payslipData.selectedEmployee,
            companyName,
            companyAddress,
            selectedMonth: month - 1, // 0-indexed for export service
            selectedYear: year,
            companyWorkingDays: payslipData.companyWorkingDays,
            title: "Pay Slip"
        });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 max-sm:p-0">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden max-sm:rounded-none max-sm:h-full max-sm:max-h-full max-sm:max-w-full relative">

                    {/* Close Button overlaying the PayslipPreview */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-[70] p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-20 min-h-[400px]">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Loading Payslip...</p>
                            </div>
                        ) : !employeeData || !row || !payslipData ? (
                            <div className="text-center py-20 text-gray-400 text-sm">No record available for this period.</div>
                        ) : (
                            <PayslipPreview
                                title="Pay Slip"
                                previewPayslip={payslipData.previewPayslip}
                                selectedEmployee={payslipData.selectedEmployee as any}
                                companyName={companyName}
                                selectedYear={year}
                                selectedMonth={month - 1} // 0-indexed for component
                                companyWorkingDays={payslipData.companyWorkingDays}
                                exportPDF={() => handleExport('pdf')}
                                exportExcel={() => handleExport('excel')}
                                exportCSV={() => handleExport('csv')}
                                onClose={onClose}
                            />
                        )}
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
