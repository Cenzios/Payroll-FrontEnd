/** Pending REGISTRATION invoice returned by GET /subscription/current (money as decimal strings). */
export interface PendingInvoice {
  id: string;
  billingType: 'REGISTRATION' | 'MONTHLY';
  employeeCount: number;
  pricePerEmployee: string;
  registrationFee: string;
  totalAmount: string;
}

/** Fields of GET /subscription/current used for billing display. */
export interface CurrentSubscription {
  planId: string;
  planName: string;
  pricePerEmployee: string;
  registrationFee: string;
  maxEmployees: number;
  usedEmployees: number;
  status: string;
  /** null for a free trial (it does not bill, it ends on trialEndsAt). */
  nextBillingDate: string | null;
  isTrial: boolean;
  trialEndsAt: string | null;
  pendingInvoice: PendingInvoice | null;
  isCancelled: boolean;
  cancelledEndDate: string | null;
}
