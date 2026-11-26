import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from '../store/hooks';
import { Loader2, Receipt, LogOut, CreditCard } from 'lucide-react';
import axiosInstance from '../api/axios';
import bgIllustration from '../assets/images/Background-illustration.svg';
import { useLogout } from '../hooks/useLogout';
import InvoiceSummaryCard, { BlockingInvoice, daysOverdue } from '../components/InvoiceSummaryCard';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface AccessStatus {
    status: 'ACTIVE' | 'BLOCKED';
    code?: string;
    message?: string;
    /** Whether an invoice can be paid now (older APIs omit it: treated as payable). */
    hasPayableInvoice?: boolean;
}

interface ApiEnvelope<T> {
    message?: string;
    data?: T;
}

interface RenewResult {
    clientSecret?: string;
    invoice?: BlockingInvoice;
}

const NO_INVOICE_MESSAGE = 'You have no outstanding invoices to settle.';
const CARD = 'bg-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center px-4 border';
const PRIMARY_BTN = 'flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';

function apiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
}

function isNotFound(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 404;
}

const NoPendingCard = ({ isActive, onDashboard }: { isActive: boolean; onDashboard: () => void }): JSX.Element => (
    <div className={`${CARD} py-20 border-blue-50`}>
        <div className="bg-green-50 rounded-full p-4 mb-4">
            <Receipt className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Invoices</h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
            {isActive ? `Your subscription is active. ${NO_INVOICE_MESSAGE}` : NO_INVOICE_MESSAGE}
        </p>
        <button onClick={onDashboard} className={PRIMARY_BTN}>Go to Dashboard</button>
    </div>
);

/** Blocked, but there is no invoice to pay (e.g. no subscription yet, or an expired trial). */
const ChoosePlanCard = ({ message, onChoosePlan }: { message?: string; onChoosePlan: () => void }): JSX.Element => (
    <div className={`${CARD} py-16 border-blue-50`}>
        <div className="bg-blue-50 rounded-full p-4 mb-4">
            <Receipt className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nothing to pay</h2>
        <p className="text-gray-600 text-center mb-2 max-w-md">{NO_INVOICE_MESSAGE}</p>
        <p className="text-gray-600 text-center mb-8 max-w-md">
            {message || 'You do not have an active subscription. Choose a plan to continue.'}
        </p>
        <button onClick={onChoosePlan} className={PRIMARY_BTN}>Choose a plan</button>
    </div>
);

interface PayNowCardProps {
    message?: string;
    isStarting: boolean;
    onPay: () => void;
}

const PayNowCard = ({ message, isStarting, onPay }: PayNowCardProps): JSX.Element => (
    <div className={`${CARD} py-16 border-blue-50`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Required</h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
            {message || 'Your account has an outstanding invoice. Settle it to continue.'}
        </p>
        <button onClick={onPay} disabled={isStarting} className={PRIMARY_BTN}>
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            {isStarting ? 'Preparing payment...' : 'Pay now'}
        </button>
    </div>
);

const CheckoutPanel = ({ invoice, clientSecret }: { invoice: BlockingInvoice; clientSecret: string }): JSX.Element => (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
        <InvoiceSummaryCard invoice={invoice} />
        <div className="bg-white rounded-[2rem] shadow-xl p-10 flex flex-col border border-blue-50">
            <div className="mb-10 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Secure Payment via Stripe</h2>
                <p className="text-gray-500 text-[15px]">
                    Select your preferred payment method and enter your card details to clear the balance.
                </p>
            </div>
            <div className="flex-1">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm amount={invoice.totalAmount} currency="LKR" />
                </Elements>
            </div>
        </div>
    </div>
);

/**
 * Billing page for blocked accounts. Opening it only READS the access status;
 * a payment intent is created only when the user clicks "Pay now".
 */
const SettleInvoice = (): JSX.Element => {
    const navigate = useNavigate();
    const handleLogout = useLogout();
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const [access, setAccess] = useState<AccessStatus | null>(null);
    const [invoice, setInvoice] = useState<BlockingInvoice | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [noPendingInvoice, setNoPendingInvoice] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const startInFlight = useRef(false);

    // Read-only on mount: never creates payment rows
    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        axiosInstance
            .get<ApiEnvelope<AccessStatus>>('/subscription/access-status', { signal: controller.signal })
            .then((res) => setAccess(res.data.data ?? { status: 'ACTIVE' }))
            .catch((err: unknown) => {
                if (!axios.isCancel(err)) setError(apiErrorMessage(err, 'Could not load your billing status.'));
            });
        return () => controller.abort();
    }, [isAuthenticated]);

    const startPayment = useCallback(async (): Promise<void> => {
        if (startInFlight.current) return; // double-click guard
        startInFlight.current = true;
        setIsStarting(true);
        setError(null);
        try {
            const { data } = await axiosInstance.post<ApiEnvelope<RenewResult>>('/payments/renew-monthly', {});
            if (data.data?.clientSecret && data.data.invoice) {
                setInvoice(data.data.invoice);
                setClientSecret(data.data.clientSecret);
            } else {
                setError('Could not start the payment. Please contact support.');
            }
        } catch (err: unknown) {
            if (isNotFound(err)) setNoPendingInvoice(true);
            else setError(apiErrorMessage(err, 'Failed to establish payment session.'));
        } finally {
            startInFlight.current = false;
            setIsStarting(false);
        }
    }, []);

    const isActive = access?.status === 'ACTIVE';
    // Blocked without a payable invoice (e.g. NO_SUBSCRIPTION): offer a plan, never "Pay now"
    const needsPlan = access?.status === 'BLOCKED' && (access.hasPayableInvoice === false || noPendingInvoice);
    const canPay = access?.status === 'BLOCKED' && !needsPlan;
    const nothingToPay = isActive || needsPlan;
    const title = nothingToPay ? 'Billing' : invoice && daysOverdue(invoice) > 0 ? 'Payment Overdue' : 'Payment Required';

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col pt-12 px-4 pb-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>
            <div className="w-full max-w-6xl mx-auto relative z-10 flex items-center justify-center mb-10">
                <h1 className="text-4xl font-extrabold text-[#111827] text-center">{title}</h1>
                <button
                    onClick={() => void handleLogout()}
                    className="absolute right-0 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-semibold"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
            <div className="w-full max-w-6xl mx-auto relative z-10 space-y-8">
                {!access && !error && (
                    <div className={`${CARD} py-24 border-blue-50`}>
                        <Loader2 className="h-14 w-14 animate-spin text-blue-600 mb-6" />
                        <p className="text-gray-600 font-semibold text-lg">Checking your billing status...</p>
                    </div>
                )}
                {isActive && <NoPendingCard isActive={isActive} onDashboard={() => navigate('/dashboard')} />}
                {needsPlan && <ChoosePlanCard message={access?.message} onChoosePlan={() => navigate('/get-plan')} />}
                {error && !nothingToPay && (
                    <div className={`${CARD} py-12 border-red-100`}>
                        <p className="text-red-600 text-center max-w-md">{error}</p>
                    </div>
                )}
                {canPay && !clientSecret && (
                    <PayNowCard message={access.message} isStarting={isStarting} onPay={() => void startPayment()} />
                )}
                {canPay && invoice && clientSecret && <CheckoutPanel invoice={invoice} clientSecret={clientSecret} />}
            </div>
            <div className="absolute bottom-[-350px] right-[-200px] w-[700px] h-[700px] z-0 pointer-events-none">
                <img src={bgIllustration} alt="Background Wave" className="w-full h-full object-contain" />
            </div>
        </div>
    );
};

export default SettleInvoice;
