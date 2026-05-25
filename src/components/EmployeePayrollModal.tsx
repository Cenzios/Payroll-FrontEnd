import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { exportPayslip } from '../utils/exportService';
import { useGetCompaniesQuery } from '../store/apiSlice';
import Toast from './Toast';
import PayslipPreview from './PayslipPreview';

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

    if (!isOpen) return null;

    const row: MonthlyData | undefined = employeeData?.monthlyBreakdown?.[0];
    const selectedCompany = companies?.find(c => c.id === companyId);
    const companyName = selectedCompany?.name || 'Company Name';
    const companyAddress = selectedCompany?.address || '';

    // Data Mapper for PayslipPreview
    const getPayslipData = () => {
        if (!employeeData || !row) return null;

        const payslipDeductions = [
            ...(row.customDeductions || []).map(d => ({ name: d.type, amount: d.amount })),
            ...(row.loanDeduction && row.loanDeduction > 0 ? [{ name: 'Loan Installment', amount: row.loanDeduction }] : []),
            ...(row.salaryAdvance && row.salaryAdvance > 0 ? [{ name: 'Salary Advance', amount: row.salaryAdvance }] : []),
        ];

        return {
            previewPayslip: {
                salaryType: employeeData.salaryType || 'MONTHLY',
                basicSalary: employeeData.basicSalary || row.basicPay,
                workedDays: row.workedDays,
                basicPay: row.basicPay,
                otAmount: row.otAmount,
                otHours: row.otHours,
                allowances: (row.allowances || []).map(a => ({ name: a.type, amount: a.amount })),
                isEpfEnabled: !!row.employeeEPF,
                epf8: row.employeeEPF,
                loanDeduction: row.loanDeduction || 0,
                deductions: payslipDeductions,
                totalDeductions: row.deductions,
                netSalary: row.netPay,
                epf12: row.companyEPFETF * (12 / 15),
                etf3: row.companyEPFETF * (3 / 15),
                leaveDays: 0,
                nonPaidLeaveDeduction: 0,
                workingDays: row.workedDays // fallback for workedDays in some parts of PayslipPreview
            },
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
            previewPayslip: payslipData.previewPayslip as any,
            selectedEmployee: payslipData.selectedEmployee as any,
            companyName,
            companyAddress,
            selectedMonth: month - 1, // 0-indexed for export service
            selectedYear: year,
            companyWorkingDays: row?.companyWorkingDays || row?.workedDays || 0
        });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 max-sm:p-0">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-sm:rounded-none max-sm:h-full max-sm:max-w-full relative">

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
                                previewPayslip={payslipData.previewPayslip}
                                selectedEmployee={payslipData.selectedEmployee as any}
                                companyName={companyName}
                                selectedYear={year}
                                selectedMonth={month - 1} // 0-indexed for component
                                companyWorkingDays={row.companyWorkingDays || row.workedDays || 0}
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
