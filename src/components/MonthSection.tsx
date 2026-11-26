import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PayrollSummaryEmployee } from '../types/report.types';
import { formatMoney, formatRs } from '../utils/money';
import { rowDeduction, rowGross, rowNet } from '../utils/reportRow';

// Money fields are decimal strings (API contract).
type EmployeePayrollData = PayrollSummaryEmployee;

interface MonthTotals {
    totalEmployees: number;
    totalGrossPay: string;
    totalNetPay: string;
    totalEmployeeEPF: string;
    totalCompanyEPFETF: string;
}

interface MonthSectionProps {
    year: number;
    month: string;
    monthNumber: number;
    status: 'Completed' | 'Pending';
    employees: EmployeePayrollData[];
    totals: MonthTotals;
    isExpanded: boolean;
    onToggle: () => void;
    selectedEmployeeIds: string[];
    onSelectEmployee: (id: string, month: number, year: number) => void;
    onViewEmployee: (id: string, companyId: string) => void;
    companyId: string;
    /** Rows in this month before the search filter (to pick the empty-state message). */
    unfilteredCount: number;
}

const MonthSection: React.FC<MonthSectionProps> = ({
    year,
    month,
    monthNumber,
    status,
    employees,
    totals,
    isExpanded,
    onToggle,
    selectedEmployeeIds,
    onSelectEmployee,
    onViewEmployee,
    companyId,
    unfilteredCount
}) => {
    // Rows arrive already filtered by the page's search box
    const filteredEmployees = employees;

    return (
        <div className="border border-gray-200 rounded-xl mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Month Header */}
            <div
                onClick={onToggle}
                className="bg-gradient-to-r rounded-xl from-blue-50 to-indigo-50 px-6 sm:pr-8 py-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all max-sm:p-4"
            >
                <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 max-sm:gap-2 shrink-0">
                        {/* Expand/Collapse Icon */}
                        <div className="text-blue-600">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5  max-sm:w-4 max-sm:h-4" />
                            ) : (
                                <ChevronDown className="w-5 h-5  max-sm:w-4 max-sm:h-4" />
                            )}
                        </div>

                        {/* Month & Year */}
                        <div>
                            <h3 className="text-[14px] font-light text-gray-900">{month} {year}</h3>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-regular whitespace-nowrap shrink-0 ${status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {status}
                        </span>
                    </div>

                    {/* Wraps instead of clipping the last column (e.g. "Total Net Pay" at 1440px) */}
                    <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-2 min-w-0 flex-1 justify-end">
                        {/* Summary Info */}
                        <div className="flex flex-col items-center shrink-0 text-center">
                            <div className="text-sm text-gray-500 whitespace-nowrap">Employees</div>
                            <div className="text-base font-medium text-gray-900 whitespace-nowrap">{totals.totalEmployees}</div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-right">
                            <div className="text-sm text-gray-500 whitespace-nowrap">Employee EPF</div>
                            <div className="text-base font-medium text-blue-600 whitespace-nowrap">{formatRs(totals.totalEmployeeEPF)}</div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-right">
                            <div className="text-sm text-gray-500 whitespace-nowrap">Company EPF/ETF</div>
                            <div className="text-base font-medium text-blue-600 whitespace-nowrap">{formatRs(totals.totalCompanyEPFETF)}</div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-right">
                            <div className="text-sm text-gray-500 whitespace-nowrap">Total Net Pay</div>
                            <div className="text-base font-medium text-blue-600 whitespace-nowrap">{formatRs(totals.totalNetPay)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Table (Collapsible) */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    {filteredEmployees.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            {unfilteredCount === 0 ? 'No payroll records found for the selected period.' : 'No matching employees found.'}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-sm">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                                        <tr>
                                            {/* <th className="px-4 py-3 border-b border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployeeIds.includes(`${emp.employeeId}-${year}-${monthNumber}`))}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            filteredEmployees.forEach(emp => {
                                                                if (!selectedEmployeeIds.includes(`${emp.employeeId}-${year}-${monthNumber}`)) {
                                                                    onSelectEmployee(emp.employeeId, monthNumber, year);
                                                                }
                                                            });
                                                        } else {
                                                            filteredEmployees.forEach(emp => {
                                                                if (selectedEmployeeIds.includes(`${emp.employeeId}-${year}-${monthNumber}`)) {
                                                                    onSelectEmployee(emp.employeeId, monthNumber, year);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th> */}
                                            <th className="px-6 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-left">Employee ID</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 whitespace-nowrap text-left">Employee Name</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200">Worked Days</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-end">Basic Pay</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-end">OT</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-end">Allowance</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-end">Gross</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200 text-end">Deduction</th>
                                            <th className="px-4 py-3 text-blue-600 font-bold text-[12.5px] border-b border-gray-200 text-end">Net Salary</th>
                                            <th className="px-4 py-3 text-gray-900 font-bold text-[12.5px] border-b border-gray-200">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredEmployees.map((employee, index) => {
                                            // Stored salary-row figures; never recomputed here
                                            const grossEarnings = rowGross(employee);
                                            const totalDeductions = rowDeduction(employee);
                                            const netPay = rowNet(employee);

                                            return (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    {/* <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployeeIds.includes(`${employee.employeeId}-${year}-${monthNumber}`)}
                                                        onChange={() => onSelectEmployee(employee.employeeId, monthNumber, year)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td> */}
                                                    <td className="px-6 py-3 font-regular text-gray-900 text-left">{employee.employeeCode || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-left">{employee.employeeName || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-center">{employee.workingDays}</td>
                                                    {/* <td className="px-4 py-3 text-gray-500 font-medium text-end">{employee.basicSalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> */}
                                                    <td className="px-4 py-3 text-gray-500 font-medium text-end">
                                                        {formatMoney(employee.basicPay)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        <div className="font-medium text-gray-500 text-end">{formatMoney(employee.otAmount)}</div>
                                                        {/* <div className="text-[10px] text-gray-400">({employee.otHours} hrs)</div> */}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 font-regular whitespace-nowrap text-end">{formatMoney(employee.allowanceTotal)}</td>
                                                    <td className="px-4 py-3 font-regular text-gray-500 whitespace-nowrap text-end">{formatMoney(grossEarnings)}</td>
                                                    <td className="px-4 py-3 text-gray-500 font-regular whitespace-nowrap text-end">{formatMoney(totalDeductions)}</td>
                                                    <td className="px-4 py-3 font-regular text-blue-600 whitespace-nowrap text-end">{formatMoney(netPay)}</td>
                                                    <td className="px-4 py-3 text-end">
                                                        <button
                                                            onClick={() => onViewEmployee(employee.employeeId, companyId)}
                                                            className="px-6 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 text-xs transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Month Totals Footer */}
                            {/* <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                                <div className="grid grid-cols-5 gap-6 max-sm:gap-[130px] max-sm:overflow-x-auto max-sm:whitespace-nowrap">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Employees</div>
                                        <div className="text-lg text-gray-900 mt-1 max-sm:text-base">{totals.totalEmployees}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Gross Pay</div>
                                        <div className="text-lg text-blue-600 mt-1 max-sm:text-base">{formatRs(totals.totalGrossPay)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Net Pay</div>
                                        <div className="text-lg text-blue-600 mt-1 max-sm:text-base">{formatRs(totals.totalNetPay)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Employee EPF</div>
                                        <div className="text-lg text-blue-600 mt-1 max-sm:text-base">{formatRs(totals.totalEmployeeEPF)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Company EPF/ETF</div>
                                        <div className="text-lg text-blue-600 mt-1 max-sm:text-base">{formatRs(totals.totalCompanyEPFETF)}</div>
                                    </div>
                                </div>
                            </div> */}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonthSection;
