import { useState, useEffect } from 'react';
import { Search, Loader2, Download, FileText, FileSpreadsheet, Calculator, Wallet } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useGetEmployeesQuery, useGetCompaniesQuery } from '../store/apiSlice';
import { salaryApi } from '../api/salaryApi';
import { Employee } from '../types/employee.types';
import Toast from '../components/Toast';
import SalaryListSkeleton from '../components/skeletons/SalaryListSkeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    setCompanyWorkingDays,
    setEmployeeWorkedDays,
    toggleEpfEtf,
    setPreviewPayslip,
    setMonth,
    setYear
} from '../store/slices/salarySlice';

const Salary = () => {
    const dispatch = useAppDispatch();
    const { selectedCompanyId } = useAppSelector((state) => state.auth);
    const {
        companyWorkingDays,
        employeeWorkedDays,
        employeeEpfEtf,
        previewPayslip,
        selectedMonth,
        selectedYear
    } = useAppSelector((state) => state.salary);

    const [search, setSearch] = useState('');

    // Selection State
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Touch tracking for validation
    const [touchedFields, setTouchedFields] = useState<{
        month: boolean;
        companyDays: boolean;
        employeeDays: Record<string, boolean>;
    }>({
        month: false,
        companyDays: false,
        employeeDays: {}
    });

    // RTK Query for Employees
    const { data, isLoading } = useGetEmployeesQuery({
        companyId: selectedCompanyId || '',
        page: 1,
        limit: 100,
        search,
        status: 'ACTIVE' // Fetch ACTIVE only
    }, {
        skip: !selectedCompanyId
    });

    const employees = data?.employees || [];

    // Fetch Companies to get the name
    const { data: companies } = useGetCompaniesQuery();
    const selectedCompany = companies?.find(c => c.id === selectedCompanyId);
    const companyName = selectedCompany?.name || 'Company Name';

    // Helper functions for Redux State
    const getEmployeeValues = (empId: string) => {
        const workedDays = employeeWorkedDays[empId] ?? companyWorkingDays;
        const isEpfEnabled = employeeEpfEtf[empId] ?? true;
        return { workedDays, isEpfEnabled };
    };

    // --- Validation Logic ---
    const getMaxAllowedDays = (year: number, month: number) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // If future month entirely
        if (year > currentYear || (year === currentYear && month > currentMonth)) {
            return 0; // Invalid
        }

        // If current month, return days elapsed so far
        if (year === currentYear && month === currentMonth) {
            return now.getDate();
        }

        // If past month, return total days in that month
        return new Date(year, month + 1, 0).getDate();
    };

    const maxAllowedCompanyDays = getMaxAllowedDays(selectedYear, selectedMonth);
    const isFutureMonth = new Date(selectedYear, selectedMonth) > new Date(new Date().getFullYear(), new Date().getMonth());

    // Derived Errors (only shown if touched)
    const monthError = (touchedFields.month && isFutureMonth) ? 'Cannot generate for future months' : null;

    const companyDaysError = (touchedFields.companyDays && (companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays))
        ? `Must be between 1 and ${maxAllowedCompanyDays} days`
        : null;

    const getEmployeeError = (empId: string, workedDays: number) => {
        if (!touchedFields.employeeDays[empId]) return null;
        if (workedDays < 0) return 'Cannot be negative';
        if (workedDays > companyWorkingDays) return `Cannot exceed company days (${companyWorkingDays})`;
        return null;
    };

    // Check if ANY validation error exists (for button disable)
    const hasAnyError = () => {
        if (isFutureMonth) return true;
        if (companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays) return true;
        if (selectedEmployee) {
            const { workedDays } = getEmployeeValues(selectedEmployee.id);
            if (workedDays < 0 || workedDays > companyWorkingDays) return true;
        }
        return false;
    };

    const handleCompanyWorkingDaysChange = (val: number) => {
        setTouchedFields(prev => ({ ...prev, companyDays: true }));
        dispatch(setCompanyWorkingDays(val));
    };

    const handleEmployeeWorkedDaysChange = (empId: string, val: number) => {
        setTouchedFields(prev => ({
            ...prev,
            employeeDays: { ...prev.employeeDays, [empId]: true }
        }));
        dispatch(setEmployeeWorkedDays({ id: empId, days: val }));
    };

    const handleMonthChange = (month: number) => {
        setTouchedFields(prev => ({ ...prev, month: true }));
        dispatch(setMonth(month));
    };

    const handleYearChange = (year: number) => {
        setTouchedFields(prev => ({ ...prev, month: true }));
        dispatch(setYear(year));
    };

    const handleToggleEpfEtf = (empId: string) => {
        const currentVal = employeeEpfEtf[empId] ?? true;
        dispatch(toggleEpfEtf({ id: empId, value: !currentVal }));
    };

    // Handle Generate Pay Slip
    const handleGeneratePayslip = async (emp: Employee) => {
        setSelectedEmployee(emp);

        const { workedDays, isEpfEnabled } = getEmployeeValues(emp.id);

        // FINAL VALIDATION BLOCK - Mark all as touched and check
        setTouchedFields({
            month: true,
            companyDays: true,
            employeeDays: { ...touchedFields.employeeDays, [emp.id]: true }
        });

        if (isFutureMonth || companyWorkingDays < 1 || companyWorkingDays > maxAllowedCompanyDays || workedDays < 0 || workedDays > companyWorkingDays) {
            setToast({ message: 'Please fix validation errors before generating', type: 'error' });
            return;
        }

        const dailyRate = emp.dailyRate;
        const basicSalary = dailyRate * workedDays;

        // Calculations
        let epfEmployee = 0;
        let epfEmployer = basicSalary * 0.12;
        let etfEmployer = basicSalary * 0.03;

        if (isEpfEnabled) {
            epfEmployee = basicSalary * 0.08;
        } else {
            epfEmployer = 0;
            etfEmployer = 0;
        }

        const tax = 0; // Tax will be calculated by backend
        const totalDeductions = epfEmployee + tax;
        const netSalary = basicSalary - totalDeductions;

        const details = {
            basicSalary,
            epfEmployee,
            epfEmployer,
            etfEmployer,
            tax,
            totalDeductions,
            netSalary,
            workedDays,
            dailyRate,
            isEpfEnabled
        };

        dispatch(setPreviewPayslip(details));

        // Save to DB
        if (!selectedCompanyId) return;
        setIsSaving(true);
        try {
            await salaryApi.saveSalary({
                companyId: selectedCompanyId,
                employeeId: emp.id,
                month: selectedMonth + 1,
                year: selectedYear,
                workingDays: workedDays,
                basicPay: basicSalary,
                employeeEPF: epfEmployee,
                employerEPF: epfEmployer,
                etfAmount: etfEmployer,
                netSalary: netSalary
            });
            setToast({ message: 'Salary saved successfully!', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.response?.data?.message || 'Failed to save salary', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectEmployee = (emp: Employee) => {
        setSelectedEmployee(emp);
    };

    // Export Functions
    const exportPDF = () => {
        if (!previewPayslip || !selectedEmployee) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(companyName.toUpperCase(), 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 105, 30, { align: 'center' });

        doc.line(14, 35, 196, 35);

        // Employee Details
        doc.setFontSize(10);
        doc.text(`Employee Name : ${selectedEmployee.fullName}`, 14, 45);
        doc.text(`Employee No   : ${selectedEmployee.employeeId}`, 14, 52);
        doc.text(`Designation   : ${selectedEmployee.designation}`, 14, 59);

        // Earnings
        doc.setFontSize(11);
        doc.text('EARNINGS', 14, 70);

        autoTable(doc, {
            startY: 75,
            head: [['Description', 'Amount (Rs.)']],
            body: [
                ['Daily Rate', previewPayslip.dailyRate.toLocaleString()],
                ['Working Days', companyWorkingDays.toString()],
                ['Worked Days', previewPayslip.workedDays.toString()],
                [`Basic Salary (${previewPayslip.dailyRate} x ${previewPayslip.workedDays})`, previewPayslip.basicSalary.toLocaleString()],
                ['Gross Earnings', previewPayslip.basicSalary.toLocaleString()]
            ],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 1: { halign: 'right' } }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 10;

        // Deductions
        doc.text('DEDUCTIONS', 14, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Description', 'Amount (Rs.)']],
            body: [
                ['EPF Employee (8%)', previewPayslip.epfEmployee > 0 ? previewPayslip.epfEmployee.toLocaleString() : '-'],
                ['Tax (PAYE)', previewPayslip.tax.toLocaleString()],
                ['Total Deductions', previewPayslip.totalDeductions.toLocaleString()]
            ],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 1: { halign: 'right' } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Net Salary
        doc.setLineWidth(0.5);
        doc.line(14, currentY, 196, currentY);
        doc.setFontSize(12);
        doc.text('NET SALARY', 14, currentY + 8);
        doc.text(`Net Salary Payable (Rs.) : ${previewPayslip.netSalary.toLocaleString()}`, 196, currentY + 8, { align: 'right' });
        doc.line(14, currentY + 12, 196, currentY + 12);
        doc.line(14, currentY + 14, 196, currentY + 14);

        currentY += 25;

        // Employer Contributions
        doc.setFontSize(10);
        doc.text('EMPLOYER CONTRIBUTIONS (Not included in Net Salary)', 14, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            body: [
                ['EPF Employer (12%)', previewPayslip.epfEmployer.toLocaleString()],
                ['ETF Employer (3%)', previewPayslip.etfEmployer.toLocaleString()]
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1 },
            columnStyles: { 1: { halign: 'right' } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 30;

        // Signatures
        doc.text('Prepared By : ___________________', 14, currentY);
        doc.text(`Date : ${new Date().toLocaleDateString()}`, 110, currentY);

        doc.text('Checked By  : ___________________', 14, currentY + 15);

        doc.text('Employee Sign : ___________________', 14, currentY + 30);

        doc.save(`Payslip_${selectedEmployee.employeeId}_${selectedMonth + 1}_${selectedYear}.pdf`);
    };

    const exportExcel = () => {
        if (!previewPayslip || !selectedEmployee) return;

        const wsData = [
            [companyName.toUpperCase()],
            [`PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Employee Name', selectedEmployee.fullName],
            ['Employee No', selectedEmployee.employeeId],
            ['Designation', selectedEmployee.designation],
            [],
            ['EARNINGS', 'Amount (Rs.)'],
            ['Daily Rate', previewPayslip.dailyRate],
            ['Worked Days', previewPayslip.workedDays],
            ['Basic Salary', previewPayslip.basicSalary],
            ['Gross Earnings', previewPayslip.basicSalary],
            [],
            ['DEDUCTIONS', 'Amount (Rs.)'],
            ['EPF Employee (8%)', previewPayslip.epfEmployee],
            ['Tax (PAYE)', previewPayslip.tax],
            ['Total Deductions', previewPayslip.totalDeductions],
            [],
            ['NET SALARY PAYABLE', previewPayslip.netSalary],
            [],
            ['EMPLOYER CONTRIBUTIONS', 'Amount (Rs.)'],
            ['EPF Employer (12%)', previewPayslip.epfEmployer],
            ['ETF Employer (3%)', previewPayslip.etfEmployer]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payslip");
        XLSX.writeFile(wb, `Payslip_${selectedEmployee.employeeId}.xlsx`);
    };

    const exportCSV = () => {
        if (!previewPayslip || !selectedEmployee) return;

        const wsData = [
            [companyName.toUpperCase()],
            [`PAY SLIP - ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Employee Name', selectedEmployee.fullName],
            ['Employee No', selectedEmployee.employeeId],
            ['Designation', selectedEmployee.designation],
            [],
            ['EARNINGS', 'Amount (Rs.)'],
            ['Daily Rate', previewPayslip.dailyRate],
            ['Worked Days', previewPayslip.workedDays],
            ['Basic Salary', previewPayslip.basicSalary],
            ['Gross Earnings', previewPayslip.basicSalary],
            [],
            ['DEDUCTIONS', 'Amount (Rs.)'],
            ['EPF Employee (8%)', previewPayslip.epfEmployee],
            ['Tax (PAYE)', previewPayslip.tax],
            ['Total Deductions', previewPayslip.totalDeductions],
            [],
            ['NET SALARY PAYABLE', previewPayslip.netSalary],
            [],
            ['EMPLOYER CONTRIBUTIONS', 'Amount (Rs.)'],
            ['EPF Employer (12%)', previewPayslip.epfEmployer],
            ['ETF Employer (3%)', previewPayslip.etfEmployer]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Payslip_${selectedEmployee.employeeId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-64 p-8 min-h-screen flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 shrink-0">
                    <div>
                        <h1 className="text-[28px] font-medium text-gray-900 leading-tight">Salary</h1>
                        <p className="text-[16px] font-normal text-gray-500 mt-1 leading-[1.7]">View and calculate employee salaries</p>
                    </div>
                </header>

                {/* Filters/Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="w-full max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Employee..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    {/* Month & Year Pickers */}
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                            className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium border-none outline-none cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                            className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium border-none outline-none cursor-pointer"
                        >
                            {Array.from({ length: 6 }, (_, i) => {
                                const year = new Date().getFullYear() - 5 + i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                        {/* Working Days Editable Input within same style container */}
                        <div className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium flex items-center gap-2">
                            <span>Working Days:</span>
                            <input
                                type="number"
                                value={companyWorkingDays}
                                onChange={(e) => handleCompanyWorkingDaysChange(parseInt(e.target.value) || 0)}
                                onBlur={() => setTouchedFields(prev => ({ ...prev, companyDays: true }))}
                                className="w-12 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center font-bold text-gray-800"
                                min="0" max="31"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* LEFT SIDE: Employee Salary Cards */}
                    <div className="w-1/2 overflow-y-auto pr-2 space-y-4">
                        {isLoading ? (
                            <SalaryListSkeleton />
                        ) : employees.length === 0 ? (
                            <div className="text-center p-12 text-gray-500">No employees found.</div>
                        ) : (
                            employees.map(emp => {
                                const { workedDays, isEpfEnabled } = getEmployeeValues(emp.id);
                                const empError = getEmployeeError(emp.id, workedDays);
                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleSelectEmployee(emp)}
                                        className={`bg-white rounded-xl border p-6 cursor-pointer transition-all duration-200 ${selectedEmployee?.id === emp.id
                                            ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{emp.fullName}</h3>
                                                    <p className="text-xs text-gray-500">{emp.designation}</p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                                                {emp.employeeId}
                                            </div>
                                        </div>

                                        {/* Input Controls - Visible when selected */}
                                        {selectedEmployee?.id === emp.id && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {/* Earnings */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-3">
                                                        <Calculator className="w-4 h-4" /> Earnings
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <label className="text-xs text-gray-500 block mb-1">Daily Rate</label>
                                                            <div className="font-semibold text-gray-900">Rs. {emp.dailyRate}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Enter Worked Days</label>
                                                            <input
                                                                type="number"
                                                                value={workedDays}
                                                                onChange={(e) => handleEmployeeWorkedDaysChange(emp.id, parseFloat(e.target.value) || 0)}
                                                                onBlur={() => setTouchedFields(prev => ({
                                                                    ...prev,
                                                                    employeeDays: { ...prev.employeeDays, [emp.id]: true }
                                                                }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
                                                                min="0"
                                                                max="31"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Deductions */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-3">
                                                        <Wallet className="w-4 h-4" /> Deductions
                                                    </h4>
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEpfEnabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                            {isEpfEnabled && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isEpfEnabled}
                                                            onChange={() => handleToggleEpfEtf(emp.id)}
                                                        />
                                                        <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">Apply EPF / ETF</span>
                                                    </label>
                                                </div>

                                                <div className="pt-2 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleGeneratePayslip(emp);
                                                        }}
                                                        disabled={isSaving || hasAnyError()}
                                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 ${(isSaving || hasAnyError())
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow active:scale-95'
                                                            }`}
                                                    >
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Pay-slip'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedEmployee?.id !== emp.id && (
                                            <div className="mt-4 text-center text-sm text-gray-400 italic">
                                                Click to calculate salary
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* RIGHT SIDE: Payslip Preview */}
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                            {previewPayslip && selectedEmployee ? (
                                <div className="flex flex-col">
                                    {/* Preview Container (No scroll) */}
                                    <div>
                                        <div className="p-8 font-mono text-sm">

                                            {/* Paper Effect Container */}
                                            <div className="bg-white p-6 border-2 border-dashed border-gray-300 relative mx-auto max-w-lg shadow-sm">

                                                {/* Header */}
                                                <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                                                    <h2 className="text-lg font-bold uppercase tracking-wider">{companyName}</h2>
                                                    <p className="text-xs font-semibold mt-1">Pay Slip - {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                                </div>

                                                {/* Emp Details */}
                                                <div className="mb-6 text-xs space-y-1">
                                                    <div className="flex"><span className="w-24 font-bold">Employee Name</span> <span>: {selectedEmployee.fullName}</span></div>
                                                    <div className="flex"><span className="w-24 font-bold">Employee No</span> <span>: {selectedEmployee.employeeId}</span></div>
                                                    <div className="flex"><span className="w-24 font-bold">Designation</span> <span>: {selectedEmployee.designation}</span></div>
                                                </div>

                                                {/* Earnings */}
                                                <div className="mb-6">
                                                    <div className="border-b border-gray-800 font-bold mb-2 pb-1">EARNINGS</div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Daily Rate</span>
                                                        <span>{previewPayslip.dailyRate.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Working Days</span>
                                                        <span>{companyWorkingDays}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Worked Days</span>
                                                        <span>{previewPayslip.workedDays}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 font-semibold">
                                                        <span>Basic Salary</span>
                                                        <span>{previewPayslip.basicSalary.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Deductions */}
                                                <div className="mb-6">
                                                    <div className="border-b border-gray-800 font-bold mb-2 pb-1">DEDUCTIONS</div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>EPF Employee (8%)</span>
                                                        <span>{previewPayslip.epfEmployee > 0 ? previewPayslip.epfEmployee.toLocaleString() : '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Tax (PAYE)</span>
                                                        <span>{previewPayslip.tax.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 font-semibold border-t border-gray-200 pt-1 mt-1">
                                                        <span>Total Deductions</span>
                                                        <span>{previewPayslip.totalDeductions.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Net Salary */}
                                                <div className="mb-6 border-y-2 border-gray-800 py-3 bg-gray-50">
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span>NET SALARY PAYABLE</span>
                                                        <span>Rs. {previewPayslip.netSalary.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Employer Contributions */}
                                                <div className="mb-8">
                                                    <div className="text-[10px] text-center font-semibold mb-2 text-gray-500 uppercase">Employer Contributions (Not included in Net Salary)</div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-600">
                                                        <span>EPF Employer 12%</span>
                                                        <span>{previewPayslip.epfEmployer.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-600">
                                                        <span>ETF Employer 3%</span>
                                                        <span>{previewPayslip.etfEmployer.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Signatures */}
                                                <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-[10px] text-gray-500">
                                                    <div>Prepared By : 25/11/2026</div>
                                                    <div>Checked By : ..............</div>
                                                </div>
                                                <div className="mt-4 text-[10px] text-gray-500">
                                                    Employee Sign : ________________________
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 mx-4 mb-4 rounded-lg">
                                            <button
                                                onClick={exportPDF}
                                                className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                            >
                                                <FileText className="w-4 h-4" /> Download Pay Slip (PDF)
                                            </button>
                                            <button
                                                onClick={exportExcel}
                                                className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors font-medium shadow-sm"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" /> Download Pay Slip (Excel)
                                            </button>
                                            <button
                                                onClick={exportCSV}
                                                className="w-full bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors font-medium shadow-sm"
                                            >
                                                <Download className="w-4 h-4" /> Download Pay Slip (CSV)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-600">No Payslip Generated</h3>
                                    <p className="max-w-xs mt-2 text-sm">Select an employee from the left and click "Generate Pay Slip" to preview.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Salary;
