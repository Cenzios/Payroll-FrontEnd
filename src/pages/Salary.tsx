import { useState, useEffect } from 'react';
import { Search, Loader2, Download, FileText, FileSpreadsheet, Calculator, Wallet } from 'lucide-react'; // Added Wallet
import Sidebar from '../components/Sidebar';
import { useAppSelector } from '../store/hooks';
import { employeeApi } from '../api/employeeApi';
import { Employee } from '../types/employee.types';
import Toast from '../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Define structure for calculated salary details
interface SalaryDetails {
    basicSalary: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    totalDeductions: number;
    netSalary: number;
    workedDays: number;
    dailyRate: number;
    isEpfEnabled: boolean;
}

const Salary = () => {
    const { selectedCompanyId } = useAppSelector((state) => state.auth); // Removed user from destructuring
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Selection & Input State
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [workedDays, setWorkedDays] = useState<number>(22); // Default to 22
    const [applyEpfEtf, setApplyEpfEtf] = useState(true);

    // Calculated State (for Preview)
    const [payslipData, setPayslipData] = useState<SalaryDetails | null>(null);
    const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch Employees
    useEffect(() => {
        const fetchEmployees = async () => {
            if (!selectedCompanyId) return;
            try {
                setIsLoading(true);
                // Fetch all/first page. Ideally we should have a non-paginated list or handle pagination scroll.
                // For now, fetching first 100 which covers most use cases for this UI.
                const data = await employeeApi.getEmployees(selectedCompanyId, 1, 100, search);
                setEmployees(data.employees);
            } catch (error: any) {
                setToast({ message: error.message || 'Failed to fetch employees', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployees();
    }, [selectedCompanyId, search]);

    // Handle Generate Pay Slip
    const handleGeneratePayslip = () => {
        if (!selectedEmployee) return;

        const dailyRate = selectedEmployee.dailyRate;
        const basicSalary = dailyRate * workedDays;

        // Calculations
        let epfEmployee = 0;
        let epfEmployer = basicSalary * 0.12;
        let etfEmployer = basicSalary * 0.03;

        if (applyEpfEtf) {
            epfEmployee = basicSalary * 0.08;
        }

        const totalDeductions = epfEmployee;
        const netSalary = basicSalary - totalDeductions;

        setPayslipData({
            basicSalary,
            epfEmployee,
            epfEmployer,
            etfEmployer,
            totalDeductions,
            netSalary,
            workedDays,
            dailyRate,
            isEpfEnabled: applyEpfEtf
        });
        setPreviewEmployee(selectedEmployee);
    };

    // When selecting a new employee, reset input but NOT the preview until generated
    const handleSelectEmployee = (emp: Employee) => {
        setSelectedEmployee(emp);
        // Optional: Reset inputs to defaults or keep them? 
        // User behavior usually expects reset or keeping previous if batch processing.
        // Let's reset to defaults for safety.
        setWorkedDays(22);
        setApplyEpfEtf(true);
    };

    // Export Functions
    const exportPDF = () => {
        if (!payslipData || !previewEmployee) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('COMPANY NAME (PVT) LTD', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`PAY SLIP - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 105, 30, { align: 'center' });

        doc.line(14, 35, 196, 35);

        // Employee Details
        doc.setFontSize(10);
        doc.text(`Employee Name : ${previewEmployee.fullName}`, 14, 45);
        doc.text(`Employee No   : ${previewEmployee.employeeId}`, 14, 52);
        doc.text(`Designation   : ${previewEmployee.designation}`, 14, 59);

        // Earnings
        doc.setFontSize(11);
        doc.font = "bold"; // How to set bold in jsPDF varies, but let's assume standard font usage or autotable handles it.
        doc.text('EARNINGS', 14, 70);

        autoTable(doc, {
            startY: 75,
            head: [['Description', 'Amount (Rs.)']],
            body: [
                ['Daily Rate', payslipData.dailyRate.toLocaleString()],
                ['Working Days', '30'], // Assuming standard month? Or should we use workedDays? User said "Working Days" in description but "Worked Days" input. Usually Working Days = Standard (e.g. 30/26) and Worked = Actual. I'll stick to requirement "Working Days xxx" and "Worked Days xxx". For now hardcode Working Days as 30 or derived? I'll use 30 as placeholder or omit if not tracked.
                // Let's use the input workedDays for both if we don't have standard.
                // Requirement image shows "Working Days: 30" and "Worked Days: 22". I will put 30 as standard.
                ['Working Days', '30'],
                ['Worked Days', payslipData.workedDays.toString()],
                [`Basic Salary (${payslipData.dailyRate} x ${payslipData.workedDays})`, payslipData.basicSalary.toLocaleString()],
                ['Gross Earnings', payslipData.basicSalary.toLocaleString()]
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
                ['EPF Employee (8%)', payslipData.epfEmployee > 0 ? payslipData.epfEmployee.toLocaleString() : '-'],
                ['Total Deductions', payslipData.totalDeductions.toLocaleString()]
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
        doc.text(`Net Salary Payable (Rs.) : ${payslipData.netSalary.toLocaleString()}`, 196, currentY + 8, { align: 'right' });
        doc.line(14, currentY + 12, 196, currentY + 12);
        doc.line(14, currentY + 14, 196, currentY + 14); // Double line

        currentY += 25;

        // Employer Contributions
        doc.setFontSize(10);
        doc.text('EMPLOYER CONTRIBUTIONS (Not included in Net Salary)', 14, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            body: [
                ['EPF Employer (12%)', payslipData.epfEmployer.toLocaleString()],
                ['ETF Employer (3%)', payslipData.etfEmployer.toLocaleString()]
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

        doc.save(`Payslip_${previewEmployee.employeeId}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
    };

    const exportExcel = () => {
        if (!payslipData || !previewEmployee) return;

        const wsData = [
            ['COMPANY NAME (PVT) LTD'],
            [`PAY SLIP - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Employee Name', previewEmployee.fullName],
            ['Employee No', previewEmployee.employeeId],
            ['Designation', previewEmployee.designation],
            [],
            ['EARNINGS', 'Amount (Rs.)'],
            ['Daily Rate', payslipData.dailyRate],
            ['Worked Days', payslipData.workedDays],
            ['Basic Salary', payslipData.basicSalary],
            ['Gross Earnings', payslipData.basicSalary],
            [],
            ['DEDUCTIONS', 'Amount (Rs.)'],
            ['EPF Employee (8%)', payslipData.epfEmployee],
            ['Total Deductions', payslipData.totalDeductions],
            [],
            ['NET SALARY PAYABLE', payslipData.netSalary],
            [],
            ['EMPLOYER CONTRIBUTIONS', 'Amount (Rs.)'],
            ['EPF Employer (12%)', payslipData.epfEmployer],
            ['ETF Employer (3%)', payslipData.etfEmployer]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payslip");
        XLSX.writeFile(wb, `Payslip_${previewEmployee.employeeId}.xlsx`);
    };

    const exportCSV = () => {
        if (!payslipData || !previewEmployee) return;

        const wsData = [
            ['COMPANY NAME (PVT) LTD'],
            [`PAY SLIP - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`],
            [],
            ['Employee Name', previewEmployee.fullName],
            ['Employee No', previewEmployee.employeeId],
            ['Designation', previewEmployee.designation],
            [],
            ['EARNINGS', 'Amount (Rs.)'],
            ['Daily Rate', payslipData.dailyRate],
            ['Worked Days', payslipData.workedDays],
            ['Basic Salary', payslipData.basicSalary],
            ['Gross Earnings', payslipData.basicSalary],
            [],
            ['DEDUCTIONS', 'Amount (Rs.)'],
            ['EPF Employee (8%)', payslipData.epfEmployee],
            ['Total Deductions', payslipData.totalDeductions],
            [],
            ['NET SALARY PAYABLE', payslipData.netSalary],
            [],
            ['EMPLOYER CONTRIBUTIONS', 'Amount (Rs.)'],
            ['EPF Employer (12%)', payslipData.epfEmployer],
            ['ETF Employer (3%)', payslipData.etfEmployer]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Payslip_${previewEmployee.employeeId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-64 p-8 h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Salary</h1>
                        <p className="text-sm text-gray-500 mt-1">View and calculate employee salaries</p>
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
                    {/* Month Picker Placeholder */}
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 font-medium">
                            Working Days: 30
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* LEFT SIDE: Employee Salary Cards */}
                    <div className="w-1/2 overflow-y-auto pr-2 space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="text-center p-12 text-gray-500">No employees found.</div>
                        ) : (
                            employees.map(emp => (
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

                                    {/* Inputs Section - Only show inputs if selected? Or always?
                                        Requirement: "Each employee card ... Allows entering worked days ... Allows toggling ... Action Button"
                                        So inputs should be visible. However, if I map `employees`, I need state for EACH employee if I want them all editable simultaneously.
                                        BUT requirement says: "Only one employee can be 'active' at a time (last clicked)"
                                        And "State Management Requirements: Track Selected Employee, Worked Days, etc."
                                        This implies inputs might only be active/meaningful for the selected one, or we only show inputs for the selected one?
                                        "Each employee card ... Allows entering..."
                                        If I have one state `workedDays`, it applies to the `selectedEmployee`.
                                        If I click another, `workedDays` resets.
                                        So I should probably render inputs for ALL, but bind them to the global state ONLY if selected, OR hide them if not selected?
                                        OR, clearer: Only the selected card expands to show controls?
                                        Let's try to show controls for Selected only to avoid confusion, or make the card look "Active".
                                        Actually, let's render controls for the selected one mainly, or if not selected, maybe just summary.
                                        The image shows controls inside the card.
                                        I will stick to: If selected, show values from state. If not, show values from ... default?
                                        Actually, let's just render the controls for the SELECTED card.
                                        If I click another card, it becomes selected.
                                    */}
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
                                                            onChange={(e) => setWorkedDays(parseFloat(e.target.value) || 0)}
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
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${applyEpfEtf ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                        {applyEpfEtf && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={applyEpfEtf}
                                                        onChange={(e) => setApplyEpfEtf(e.target.checked)}
                                                    />
                                                    <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">Apply EPF / ETF</span>
                                                </label>
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGeneratePayslip();
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow active:scale-95"
                                                >
                                                    Generate Pay-slip
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
                            ))
                        )}
                    </div>

                    {/* RIGHT SIDE: Payslip Preview */}
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                            {payslipData && previewEmployee ? (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Scrollable Container for Preview AND Buttons */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="p-8 font-mono text-sm">

                                            {/* Paper Effect Container */}
                                            <div className="bg-white p-6 border-2 border-dashed border-gray-300 relative mx-auto max-w-lg shadow-sm">

                                                {/* Header */}
                                                <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                                                    <h2 className="text-lg font-bold uppercase tracking-wider">Company Name (Pvt) Ltd</h2>
                                                    <p className="text-xs font-semibold mt-1">Pay Slip - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                                </div>

                                                {/* Emp Details */}
                                                <div className="mb-6 text-xs space-y-1">
                                                    <div className="flex"><span className="w-24 font-bold">Employee Name</span> <span>: {previewEmployee.fullName}</span></div>
                                                    <div className="flex"><span className="w-24 font-bold">Employee No</span> <span>: {previewEmployee.employeeId}</span></div>
                                                    <div className="flex"><span className="w-24 font-bold">Designation</span> <span>: {previewEmployee.designation}</span></div>
                                                </div>

                                                {/* Earnings */}
                                                <div className="mb-6">
                                                    <div className="border-b border-gray-800 font-bold mb-2 pb-1">EARNINGS</div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Daily Rate</span>
                                                        <span>{payslipData.dailyRate.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Working Days</span>
                                                        <span>30</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Worked Days</span>
                                                        <span>{payslipData.workedDays}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 font-semibold">
                                                        <span>Basic Salary</span>
                                                        <span>{payslipData.basicSalary.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Deductions */}
                                                <div className="mb-6">
                                                    <div className="border-b border-gray-800 font-bold mb-2 pb-1">DEDUCTIONS</div>
                                                    <div className="flex justify-between mb-1">
                                                        <span>EPF Employee (8%)</span>
                                                        <span>{payslipData.epfEmployee > 0 ? payslipData.epfEmployee.toLocaleString() : '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 font-semibold border-t border-gray-200 pt-1 mt-1">
                                                        <span>Total Deductions</span>
                                                        <span>{payslipData.totalDeductions.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Net Salary */}
                                                <div className="mb-6 border-y-2 border-gray-800 py-3 bg-gray-50">
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span>NET SALARY PAYABLE</span>
                                                        <span>Rs. {payslipData.netSalary.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Employer Contributions */}
                                                <div className="mb-8">
                                                    <div className="text-[10px] text-center font-semibold mb-2 text-gray-500 uppercase">Employer Contributions (Not included in Net Salary)</div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-600">
                                                        <span>EPF Employer 12%</span>
                                                        <span>{payslipData.epfEmployer.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-600">
                                                        <span>ETF Employer 3%</span>
                                                        <span>{payslipData.etfEmployer.toLocaleString()}</span>
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

                                        {/* Action Buttons - Now inside scrollable area */}
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
