/** Pending REGISTRATION invoice returned by GET /subscription/current (money as decimal strings). */
export interface PendingInvoice {
  id: string;
  billingType: 'REGISTRATION' | 'MONTHLY';
  employeeCount: number;
  pricePerEmployee: string;
  registrationFee: string;
  totalAmount: string;
}

/**
 * A plan change waiting for payment (GET /subscription/current → pendingPlanChange). It is never
 * the current plan: the current plan stays active until this plan's invoice is paid.
 */
export interface PendingPlanChange {
  subscriptionId: string;
  status: string;
  planId: string;
  planName: string;
  pricePerEmployee: string;
  registrationFee: string;
  maxEmployees: number;
  createdAt: string;
  /** The invoice whose payment activates this plan (null when nothing is left to pay). */
  pendingInvoice: PendingInvoice | null;
}

/** Fields of GET /subscription/current used for billing display. */
export interface CurrentSubscription {
  subscriptionId: string;
  planId: string;
  planName: string;
  pricePerEmployee: string;
  registrationFee: string;
  maxEmployees: number;
  usedEmployees: number;
  /** The plan the customer is on now (ACTIVE / PAST_DUE / CANCELLED, or PENDING_ACTIVATION during signup). */
  status: string;
  /** null for a free trial (it does not bill, it ends on trialEndsAt). */
  nextBillingDate: string | null;
  isTrial: boolean;
  trialEndsAt: string | null;
  /** Unpaid REGISTRATION invoice of the current plan (e.g. a pay-later plan). */
  pendingInvoice: PendingInvoice | null;
  /** Plan change waiting for payment, reported separately from the current plan. */
  pendingPlanChange: PendingPlanChange | null;
  isCancelled: boolean;
  cancelledEndDate: string | null;
  isTrialUser?: boolean;
  isPaid?: boolean;
  createdAt?: string;
}

/**
 * The plan a checkout page is buying: the pending plan change when there is one (its name,
 * prices, limit and invoice), otherwise the current subscription (signup or renewal).
 */
export const planBeingPurchased = (current: CurrentSubscription | null): CurrentSubscription | null => {
  if (!current?.pendingPlanChange) return current;
  const change = current.pendingPlanChange;
  return {
    ...current,
    subscriptionId: change.subscriptionId,
    status: change.status,
    planId: change.planId,
    planName: change.planName,
    pricePerEmployee: change.pricePerEmployee,
    registrationFee: change.registrationFee,
    maxEmployees: change.maxEmployees,
    pendingInvoice: change.pendingInvoice,
  };
};

/** True when the current plan is ACTIVE and no plan change is waiting for payment. */
export const isSettledActive = (current: CurrentSubscription | null | undefined): boolean =>
  current?.status === 'ACTIVE' && !current.pendingPlanChange;

/**
 * POST /subscription/change-plan result. A plan change creates a pending subscription plus this
 * invoice, and the new plan activates once the invoice is paid (card, PayHere or bank slip); the
 * current plan stays active until then. A change with nothing to pay (0.00) activates at once.
 */
export interface PlanChangeResult {
  subscriptionId: string;
  /** ACTIVE only when the change had nothing to pay (0.00 invoice, activated at once). */
  status: 'PENDING_ACTIVATION' | 'ACTIVE';
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
