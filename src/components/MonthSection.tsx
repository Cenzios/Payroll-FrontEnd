import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EmployeePayrollData {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    workingDays: number;
    grossPay: number;
    netPay: number;
    employeeEPF: number;
    companyEPFETF: number;
}

interface MonthTotals {
    totalEmployees: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalEmployeeEPF: number;
    totalCompanyEPFETF: number;
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
    onSelectEmployee: (id: string) => void;
    onViewEmployee: (id: string, companyId: string) => void;
    companyId: string;
    searchQuery?: string;
}

const MonthSection: React.FC<MonthSectionProps> = ({
    year,
    month,
    status,
    employees,
    totals,
    isExpanded,
    onToggle,
    selectedEmployeeIds,
    onSelectEmployee,
    onViewEmployee,
    companyId,
    searchQuery = ''
}) => {
    // Filter employees based on search query
    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase();
        const name = emp.employeeName?.toLowerCase() || '';
        const code = emp.employeeCode?.toLowerCase() || '';
        return name.includes(query) || code.includes(query);
    });

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Month Header */}
            <div
                onClick={onToggle}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Expand/Collapse Icon */}
                        <div className="text-blue-600">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </div>

                        {/* Month & Year */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{month} {year}</h3>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {status}
                        </span>
                    </div>

                    {/* Summary Info */}
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Employees</div>
                            <div className="text-lg font-bold text-gray-900">{totals.totalEmployees}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Total Net Pay</div>
                            <div className="text-lg font-bold text-blue-600">Rs {totals.totalNetPay.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Table (Collapsible) */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    {filteredEmployees.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            {employees.length === 0 ? 'No payroll records for this month.' : 'No matching employees found.'}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployeeIds.includes(emp.employeeId))}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            filteredEmployees.forEach(emp => {
                                                                if (!selectedEmployeeIds.includes(emp.employeeId)) {
                                                                    onSelectEmployee(emp.employeeId);
                                                                }
                                                            });
                                                        } else {
                                                            filteredEmployees.forEach(emp => {
                                                                if (selectedEmployeeIds.includes(emp.employeeId)) {
                                                                    onSelectEmployee(emp.employeeId);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-6 py-3 border-b border-gray-200">Employee ID</th>
                                            <th className="px-6 py-3 border-b border-gray-200">Employee Name</th>
                                            <th className="px-6 py-3 border-b border-gray-200">Working Days</th>
                                            <th className="px-6 py-3 border-b border-gray-200">Net Pay</th>
                                            <th className="px-6 py-3 border-b border-gray-200">Employee EPF</th>
                                            <th className="px-6 py-3 border-b border-gray-200">Company ETF/EPF</th>
                                            <th className="px-6 py-3 border-b border-gray-200 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredEmployees.map((employee, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployeeIds.includes(employee.employeeId)}
                                                        onChange={() => onSelectEmployee(employee.employeeId)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 font-semibold text-gray-900">{employee.employeeCode || '-'}</td>
                                                <td className="px-6 py-3 text-gray-700">{employee.employeeName || '-'}</td>
                                                <td className="px-6 py-3 text-gray-600">{employee.workingDays}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900">Rs {Number(employee.netPay).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-gray-600">Rs: {Number(employee.employeeEPF).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-gray-600">Rs: {Number(employee.companyEPFETF).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => onViewEmployee(employee.employeeId, companyId)}
                                                        className="px-3 py-1 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 text-xs transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Month Totals Footer */}
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                                <div className="grid grid-cols-5 gap-6">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Employees</div>
                                        <div className="text-lg font-bold text-gray-900 mt-1">{totals.totalEmployees}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Gross Pay</div>
                                        <div className="text-lg font-bold text-blue-600 mt-1">Rs {totals.totalGrossPay.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Net Pay</div>
                                        <div className="text-lg font-bold text-blue-600 mt-1">Rs {totals.totalNetPay.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Employee EPF</div>
                                        <div className="text-lg font-bold text-blue-600 mt-1">Rs {totals.totalEmployeeEPF.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 font-medium">Company EPF/ETF</div>
                                        <div className="text-lg font-bold text-blue-600 mt-1">Rs {totals.totalCompanyEPFETF.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonthSection;
