import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import type { Employee } from '../../types/employee.types';
import type { LoanInstallment, SalaryRecord } from '../../types/salary.types';
import type { SalaryDraftHandlers } from '../../components/EmployeeSalaryCard';
import {
    setCompanyWorkingDays, setEmployeeAllowances, setEmployeeDeductions, setEmployeeLeaveDays,
    setEmployeeOtHours, setEmployeeSalaryAdvance, setEmployeeSickLeaveDays, setEmployeeWorkedDays,
    setPreviewPayslip, toggleEpfEtf, toggleLoanEnabled,
} from '../../store/slices/salarySlice';
import {
    type SalaryDraftEdit,
    useApproveAllDraftsMutation, useApproveSalaryMutation, useRegenerateDraftSalaryMutation,
    useUpdateDraftSalaryMutation, useVoidDraftSalaryMutation,
} from '../../store/salaryWorkflowApi';
import { toDecimal, toDecimalString } from '../../utils/money';

type Notify = (message: string, type: 'success' | 'error') => void;

/** A DRAFT open for editing on the Salary page. */
export interface EditingDraft {
    empId: string;
    salary: SalaryRecord;
}

interface SalaryDraftWorkflow {
    editing: EditingDraft | null;
    handlers: SalaryDraftHandlers;
    isBusy: boolean;
    saveEdit: (data: SalaryDraftEdit) => Promise<void>;
    approveAll: () => Promise<void>;
}

/** Loan lines the API writes for collected instalments; not custom deductions. */
const isLoanLine = (type: string): boolean => type.startsWith('Loan Installment #');

/**
 * The instalments a draft holds, rebuilt from its loan lines ("Loan Installment #N"), so the
 * preview of a draft being edited names the instalment the API will collect again.
 */
export function draftLoanInstallments(salary: SalaryRecord, loanTitle: string): LoanInstallment[] {
    return (salary.deductions ?? []).filter((d) => isLoanLine(d.type)).map((d) => ({
        id: d.id ?? d.type,
        loanId: '',
        installmentNumber: Number(d.type.replace('Loan Installment #', '')) || 0,
        dueDate: '',
        amount: d.amount,
        paidAmount: '0',
        status: 'RESERVED',
        loan: { employeeId: salary.employeeId, loanTitle },
    }));
}

const apiMessage = (error: unknown, fallback: string): string => {
    const data = (error as { data?: { message?: string } } | null)?.data;
    return data?.message || fallback;
};

/**
 * Draft salary actions for the Salary page: edit (prefills the card from the saved draft),
 * regenerate, void, approve and approve-all. Messages shown are the API's.
 */
export function useSalaryDraftWorkflow(companyId: string | null, month: number, year: number, notify: Notify): SalaryDraftWorkflow {
    const dispatch = useAppDispatch();
    const [editing, setEditing] = useState<EditingDraft | null>(null);
    const [updateDraft, updateState] = useUpdateDraftSalaryMutation();
    const [regenerateDraft, regenerateState] = useRegenerateDraftSalaryMutation();
    const [voidDraft, voidState] = useVoidDraftSalaryMutation();
    const [approveSalary, approveState] = useApproveSalaryMutation();
    const [approveAllDrafts, approveAllState] = useApproveAllDraftsMutation();
    const isBusy = updateState.isLoading || regenerateState.isLoading || voidState.isLoading
        || approveState.isLoading || approveAllState.isLoading;

    /** Runs one API call and toasts its message; never throws. */
    const call = async (request: () => Promise<{ message: string }>, fallback: string): Promise<boolean> => {
        try {
            const result = await request();
            notify(result.message, 'success');
            return true;
        } catch (error) {
            notify(apiMessage(error, fallback), 'error');
            return false;
        }
    };

    const onEditDraft = (emp: Employee, salary: SalaryRecord): void => {
        const id = emp.id;
        // First: changing the company days clears every employee's day overrides
        if (salary.companyWorkingDays) dispatch(setCompanyWorkingDays(salary.companyWorkingDays));
        dispatch(setEmployeeWorkedDays({ id, days: salary.workingDays }));
        dispatch(setEmployeeOtHours({ id, hours: toDecimal(salary.otHours).toNumber() }));
        dispatch(setEmployeeSalaryAdvance({ id, advance: toDecimalString(salary.salaryAdvance) }));
        dispatch(setEmployeeLeaveDays({ id, days: salary.leaveDays }));
        dispatch(setEmployeeSickLeaveDays({ id, days: salary.sickLeaveDays }));
        dispatch(toggleEpfEtf({ id, value: salary.isEpfEnabled ?? true }));
        dispatch(toggleLoanEnabled({ id, value: salary.isLoanEnabled ?? true }));
        dispatch(setEmployeeAllowances({ id, allowances: (salary.allowances ?? []).map((a) => ({ type: a.type, amount: toDecimalString(a.amount) })) }));
        dispatch(setEmployeeDeductions({
            id,
            deductions: (salary.deductions ?? []).filter((d) => !isLoanLine(d.type)).map((d) => ({ type: d.type, amount: toDecimalString(d.amount) })),
        }));
        dispatch(setPreviewPayslip(null));
        setEditing({ empId: id, salary });
    };

    const handlers: SalaryDraftHandlers = {
        isWorkflowBusy: isBusy,
        onEditDraft,
        onCancelEdit: () => setEditing(null),
        onRegenerateDraft: async (salary) => {
            if (!companyId) return;
            await call(() => regenerateDraft({ id: salary.id, companyId }).unwrap(), 'Failed to regenerate the draft');
        },
        onVoidDraft: async (salary) => {
            if (!companyId) return;
            const ok = await call(() => voidDraft({ id: salary.id, companyId }).unwrap(), 'Failed to void the draft');
            if (ok) dispatch(setPreviewPayslip(null));
        },
        onApproveDraft: async (salary) => {
            if (!companyId) return;
            await call(() => approveSalary({ id: salary.id, companyId }).unwrap(), 'Failed to approve the salary');
        },
    };

    const saveEdit = async (data: SalaryDraftEdit): Promise<void> => {
        if (!companyId || !editing) return;
        const ok = await call(() => updateDraft({ id: editing.salary.id, companyId, data }).unwrap(), 'Failed to update the draft');
        if (ok) setEditing(null);
    };

    const approveAll = async (): Promise<void> => {
        if (!companyId) return;
        await call(() => approveAllDrafts({ companyId, month, year }).unwrap(), 'Failed to approve the drafts');
    };

    return { editing, handlers, isBusy, saveEdit, approveAll };
}
