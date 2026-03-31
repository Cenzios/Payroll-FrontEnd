import { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Loader2, Calendar, Percent, Info, Calculator, FileText, CheckCircle2, PlusCircle, Search, User, ChevronDown, UserRound, MessageSquareQuote, PercentCircle, PercentSquare, PercentSquareIcon, Text, CircleDollarSign, MessageSquareDiff } from 'lucide-react';
import { useGetEmployeesQuery, useCreateLoanMutation, useUploadEmployeeDocumentMutation } from '../store/apiSlice';
import { Employee } from '../types/employee.types';
import Toast from './Toast';
import FileUploadModal from './FileUploadModal';


interface CreateLoanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
}

const CreateLoanDrawer = ({ isOpen, onClose, companyId }: CreateLoanDrawerProps) => {
  const [loanTitle, setLoanTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interestRateType, setInterestRateType] = useState<'ANNUALLY' | 'MONTHLY'>('ANNUALLY');
  const [amount, setAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPremium, setMonthlyPremium] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: employeesData } = useGetEmployeesQuery(
    { companyId: companyId || '' },
    { skip: !companyId }
  );

  const [createLoan] = useCreateLoanMutation();
  const [uploadEmployeeDocument] = useUploadEmployeeDocumentMutation();

  const employees = employeesData?.employees || [];

  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp: Employee) =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate Monthly Premium
  useEffect(() => {
    const p = parseFloat(amount) || 0;
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(installmentCount) || 0;

    if (p > 0 && n > 0) {
      const totalInterest = interestRateType === 'ANNUALLY'
        ? p * (r / 100) * (n / 12)
        : p * (r / 100) * n;
      const total = p + totalInterest;
      setMonthlyPremium(total / n);
    } else {
      setMonthlyPremium(0);
    }
  }, [amount, interestRate, installmentCount, interestRateType]);

  // Auto-calculate End Date based on Start Date and Installment Count
  useEffect(() => {
    if (startDate && installmentCount) {
      const start = new Date(startDate);
      const count = parseInt(installmentCount);
      if (!isNaN(start.getTime()) && count > 0) {
        const end = new Date(start);
        end.setMonth(end.getMonth() + count);
        setEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [startDate, installmentCount]);

  const handleSubmit = async () => {
    if (!companyId || !employeeId || !loanTitle || !amount || !installmentCount) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      let documentId = undefined;

      if (supportingDocs.length > 0) {
        const formData = new FormData();
        formData.append("file", supportingDocs[0]);
        formData.append("employeeId", employeeId);
        formData.append("documentType", "LOAN");
        const uploadResult = await uploadEmployeeDocument(formData).unwrap();
        documentId = uploadResult?.data?.id;
      }

      const loanIdPrefix = 'LOAN-' + Math.floor(1000 + Math.random() * 9000);
      await createLoan({
        companyId,
        employeeId,
        loanId: loanIdPrefix,
        loanTitle,
        description,
        startDate,
        endDate,
        interestRateType,
        amount: parseFloat(amount),
        installmentCount: parseInt(installmentCount),
        interestRate: parseFloat(interestRate) || 0,
        monthlyPremium: monthlyPremium,
        supportingDocId: documentId
      }).unwrap();

      setToast({ message: 'Loan created successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error: any) {
      setToast({ message: error.data?.message || 'Failed to create loan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLoanTitle('');
    setDescription('');
    setEmployeeId('');
    setSelectedEmployeeName('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setAmount('');
    setInstallmentCount('');
    setInterestRate('');
    setSupportingDocs([]);
  };

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setInstallmentCount('');
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num > 15) {
        setInstallmentCount('15');
        setToast({ message: 'Maximum installment count is 15', type: 'error' });
      } else {
        setInstallmentCount(num.toString());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;

      e.preventDefault();
      const container = e.currentTarget as HTMLElement;
      if (container) {
        const inputs = Array.from(
          container.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ) as HTMLElement[];
        const index = inputs.indexOf(target);
        if (index > -1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          className="relative w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-3 border-b border-gray-50">
            <h2 className="text-[20px] font-bold text-[#141B3B]">Create Loan</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border border-gray-100 rounded-full transition-all text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-4">

              {/* 1. Loan Title */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Text className="h-4 w-4 text-blue-500" />
                  </div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                    Loan Title <strong className="text-red-600 text-[15px]">*</strong>
                  </label>
                </div>

                <input
                  type="text"
                  value={loanTitle}
                  onChange={(e) => setLoanTitle(e.target.value)}
                  placeholder="Personal Home Renovation"
                  className="w-full px-4 py-1.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 text-gray-900"
                />
              </div>

              {/* 2. Description */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MessageSquareQuote className="h-4 w-4 text-blue-500" />
                  </div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                    Description <strong className="text-red-600 text-[15px]">*</strong>
                  </label>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Requesting a loan for home improvement projects and general repairs."
                  rows={4}
                  className="w-full px-4 py-1.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 text-gray-900 resize-none"
                />
              </div>

              {/* 3. Employee (Searchable Dropdown) */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <UserRound className="h-4 w-4 text-blue-500" />
                  </div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                    Employee ID <strong className="text-red-600 text-[15px]">*</strong>
                  </label>
                </div>

                <div
                  className={`relative flex items-center bg-white border rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'}`}
                >
                  <div className="pl-4 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={isDropdownOpen ? searchTerm : (selectedEmployeeName || '')}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isDropdownOpen) setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search employee by name or ID..."
                    className="w-full px-3 py-1.5 text-[13px] bg-transparent outline-none text-gray-900 placeholder:text-gray-300"
                  />
                  <div className="pr-4 pointer-events-none">
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Dropdown List */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 max-h-[280px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp: Employee) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setEmployeeId(emp.id);
                            setSelectedEmployeeName(`${emp.fullName} (${emp.employeeId})`);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                          className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{emp.fullName}</span>
                              <span className="text-[12px] text-gray-400">{emp.employeeId}</span>
                            </div>
                          </div>
                          {employeeId === emp.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400 text-[13px] italic">
                        No employees found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      Start Date <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      End Date <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* 5. Interest Rate Type & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <PercentSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      Interest Rate Type <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-full p-[3px] h-[44px]">
                    <button
                      type="button"
                      onClick={() => setInterestRateType('ANNUALLY')}
                      className={`flex-1 h-full rounded-full text-[13px] font-semibold transition-all duration-200 ${interestRateType === 'ANNUALLY'
                        ? 'bg-white text-blue-600 shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                        : 'text-gray-500'
                        }`}
                    >
                      Annually
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterestRateType('MONTHLY')}
                      className={`flex-1 h-full rounded-full text-[13px] font-semibold transition-all duration-200 ${interestRateType === 'MONTHLY'
                        ? 'bg-white text-blue-600 shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                        : 'text-gray-500'
                        }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <PercentSquareIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      Interest Rate (%) <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="5.0"
                      className="no-spinner w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-[13px] font-medium">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6.1. Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <CircleDollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      Amount <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-[13px] font-medium">Rs</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="120000"
                      className="no-spinner w-full pl-11 pr-4 py-3 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* 6.2. Installments Count */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      <MessageSquareDiff className="h-4 w-4 text-blue-500" />
                    </div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                      Installment Count <strong className="text-red-600 text-[15px]">*</strong>
                    </label>
                  </div>
                  <input
                    type="number"
                    value={installmentCount}
                    onChange={handleInstallmentChange}
                    placeholder="12"
                    className="no-spinner w-full px-4 py-3 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Maximum 15 installments</p>
                </div>
              </div>

              {/* 7. Monthly Premium Banner */}
              <div className="bg-[#4174F8] rounded-2xl p-5 flex items-center justify-between text-white shadow-lg shadow-blue-500/20 border border-blue-400/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[14px] font-semibold tracking-wide">Monthly Premium</span>
                </div>
                <div className="text-[20px] font-bold">
                  Rs {monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* 8. Supporting Documents */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1 pl-6">
                    Supporting Documents <strong className="text-red-600 text-[15px]">*</strong>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-[13px] text-gray-500 font-medium group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <UploadCloud className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <span>Upload Employee Documents</span>
                  <div className="ml-auto w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors">
                    <PlusCircle className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>

                {supportingDocs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {supportingDocs.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-xl text-[12px] text-gray-700 font-medium">
                        <span className="truncate max-w-[85%]">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSupportingDocs([]); }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-50 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-[14px] font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[1.5] py-3 px-8 text-[14px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Loan'}
            </button>
          </div>
        </div>
      </div>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        files={supportingDocs}
        onFilesChange={setSupportingDocs}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default CreateLoanDrawer;
