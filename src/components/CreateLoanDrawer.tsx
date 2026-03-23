import { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, Calendar, Percent, Info, Calculator, FileText, CheckCircle2, PlusCircle } from 'lucide-react';
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
    setStartDate('');
    setEndDate('');
    setAmount('');
    setInstallmentCount('');
    setInterestRate('');
    setSupportingDocs([]);
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
        <div className="relative w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
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
            <div className="p-8 space-y-6">

              {/* 1. Loan Title */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-2">Loan Title</label>
                <input
                  type="text"
                  value={loanTitle}
                  onChange={(e) => setLoanTitle(e.target.value)}
                  placeholder="Personal Home Renovation"
                  className="w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 text-gray-900"
                />
              </div>

              {/* 2. Description */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Requesting a loan for home improvement projects and general repairs."
                  rows={4}
                  className="w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 text-gray-900 resize-none"
                />
              </div>

              {/* 3. Employee */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-2">Employee</label>
                <div className="relative">
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Employee</option>
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 4. Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* 5. Interest Rate Type & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Interest Rate Type</label>
                  <div className="p-1 bg-gray-100/80 rounded-xl flex h-[46px]">
                    <button
                      type="button"
                      onClick={() => setInterestRateType('ANNUALLY')}
                      className={`flex-1 flex items-center justify-center text-[13px] font-bold rounded-lg transition-all ${interestRateType === 'ANNUALLY'
                        ? 'bg-white text-[#3B82F6] shadow-sm border border-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Annually
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterestRateType('MONTHLY')}
                      className={`flex-1 flex items-center justify-center text-[13px] font-bold rounded-lg transition-all ${interestRateType === 'MONTHLY'
                        ? 'bg-white text-[#3B82F6] shadow-sm border border-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Interest Rate (%)</label>
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
                      <span className="text-gray-400 text-[14px] font-medium">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Amount & Installments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-[14px] font-medium">Rs</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="120000"
                      className="no-spinner w-full pl-11 pr-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Installment Count</label>
                  <input
                    type="number"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    placeholder="12"
                    className="no-spinner w-full px-4 py-3 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
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
                <label className="block text-[13px] font-semibold text-gray-700 mb-2">Supporting Documents</label>
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
