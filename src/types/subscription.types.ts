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

/**
 * POST /subscription/change-plan result. A plan change is never instant: it creates a pending
 * subscription plus this invoice, and the new plan activates once the invoice is paid
 * (card, PayHere or bank slip). The current plan stays active until then.
 */
export interface PlanChangeResult {
  subscriptionId: string;
  status: 'PENDING_ACTIVATION';
  currentSubscriptionId: string;
  plan: { id: string; name: string; employeePrice: string; registrationFee: string; maxEmployees: number };
  invoice: {
    id: string;
    billingType: 'REGISTRATION';
    status: string;
    employeeCount: number;
    pricePerEmployee: string;
    registrationFee: string;
    totalAmount: string;
  };
}

/** Message of activate-pending (409) when the user is on a paid plan: the change must be paid first. */
export const PLAN_CHANGE_PAYMENT_REQUIRED = 'PLAN_CHANGE_PAYMENT_REQUIRED';

/** Add-on slots one request may add (server validates 1..100). */
export const ADDON_MAX_SLOTS = 100;
