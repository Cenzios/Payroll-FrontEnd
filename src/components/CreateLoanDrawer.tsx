import { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { useGetEmployeesQuery, useCreateLoanMutation, useUploadEmployeeDocumentMutation } from '../store/apiSlice';
import { Employee } from '../types/employee.types';
import Toast from './Toast';

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

  const { data: employeesData } = useGetEmployeesQuery(
    { companyId: companyId || '' },
    { skip: !companyId }
  );

  const [createLoan] = useCreateLoanMutation();
  const [uploadEmployeeDocument] = useUploadEmployeeDocumentMutation();

  const employees = employeesData?.employees || [];

  useEffect(() => {
    const p = parseFloat(amount) || 0;
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(installmentCount) || 12;

    if (p > 0) {
      // EMI Formula or simple installment (matching user's request for simple check)
      // Usually, Simple interest: (P + (P * r * (n/12)/100)) / n if annually
      // For now using the simple one from initial component to stay consistent with UI expectations
      const totalInterest = interestRateType === 'ANNUALLY'
        ? p * (r / 100) * (n / 12)
        : p * (r / 100) * n;
      const total = p + totalInterest;
      setMonthlyPremium(total / n);
    } else {
      setMonthlyPremium(0);
    }
  }, [amount, interestRate, installmentCount, interestRateType]);

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

    if (parseFloat(amount) <= 0) {
      setToast({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }

    if (parseInt(installmentCount) <= 0) {
      setToast({ message: 'Installment count must be at least 1', type: 'error' });
      return;
    }

    if (parseFloat(interestRate) < 0) {
      setToast({ message: 'Interest rate cannot be negative', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      let documentId = undefined;

      if (supportingDocs.length > 0) {
        setToast({ message: "Uploading document...", type: "success" });
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
        employeeId, // This is the 'id' (UUID) from the select value
        loanId: loanIdPrefix,
        loanTitle,
        description,
        startDate,
        endDate,
        interestRateType,
        amount: parseFloat(amount),
        installmentCount: parseInt(installmentCount),
        interestRate: parseFloat(interestRate),
        monthlyPremium: monthlyPremium,
        supportingDocId: documentId
      }).unwrap();

      setToast({ message: 'Loan created successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
        // Reset fields
        setLoanTitle('');
        setDescription('');
        setEmployeeId('');
        setStartDate('');
        setEndDate('');
        setAmount('');
        setInstallmentCount('');
        setInterestRate('');
        setSupportingDocs([]);
      }, 1500);
    } catch (error: any) {
      setToast({ message: error.data?.message || 'Failed to create loan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex bg-white flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#141B3B]">Create Loan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="space-y-5">

            {/* Loan Title */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Loan Title
              </label>
              <input
                type="text"
                value={loanTitle}
                onChange={(e) => setLoanTitle(e.target.value)}
                placeholder="Personal Home Renovation"
                className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Requesting a loan for home improvement projects and general repairs."
                rows={3}
                className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-900 resize-none"
              />
            </div>

            {/* Employee */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="" disabled>Select Employee</option>
                {employees.map((emp: Employee) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Interest Rate Type Toggle */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Interest Rate Type
              </label>
              <div className="flex p-1 bg-gray-100/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInterestRateType('ANNUALLY')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${interestRateType === 'ANNUALLY'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Annually
                </button>
                <button
                  type="button"
                  onClick={() => setInterestRateType('MONTHLY')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${interestRateType === 'MONTHLY'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Amount & Installment Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-[14px] font-medium">Rs</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="120000"
                    min="0.01"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Installment Count (Months)
                </label>
                <input
                  type="number"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder="12"
                  min="1"
                  className="w-full px-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Interest Rate % */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Interest Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="5.0"
                  min="0"
                  className="w-full px-4 pr-10 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-[14px] font-medium">%</span>
                </div>
              </div>
            </div>

            {/* Monthly Premium Calculation Box */}
            <div className="bg-[#4174F8] rounded-xl p-4 flex items-center justify-between text-white shadow-sm mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-90"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                </div>
                <span className="text-[13px] font-medium opacity-90">Monthly Premium</span>
              </div>
              <div className="text-[18px] font-bold">
                Rs {monthlyPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Supporting Documents */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 mt-2">
                Supporting Documents
              </label>
              <label className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-[#3B82F6]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-[13px] font-semibold text-[#141B3B] mb-1">Click to upload or drag and drop</div>
                <div className="text-[12px] text-gray-400">Add 1 document (PDF, JPG, PNG)</div>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      if (file.size > 5 * 1024 * 1024) {
                        setToast({ message: 'File exceeds 5MB limit', type: 'error' });
                        return;
                      }
                      if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
                        setToast({ message: 'Invalid format. Use PNG, JPG, or PDF', type: 'error' });
                        return;
                      }
                      setSupportingDocs([file]);
                    }
                  }}
                />
              </label>
              {supportingDocs.length > 0 && (
                <div className="mt-2 text-sm text-gray-600 font-medium">
                  Selected: {supportingDocs[0].name}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-6 bg-white shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : 'Create Loan'}
          </button>
        </div>

      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default CreateLoanDrawer;
