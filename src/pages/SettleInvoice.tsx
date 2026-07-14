import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Loader2, Receipt, AlertTriangle, LogOut } from 'lucide-react';
import axiosInstance from '../api/axios';
import bgIllustration from '../assets/images/Background-illustration.svg';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const SettleInvoice = () => {
    const navigate = useNavigate();
    const { token } = useAppSelector((state) => state.auth);

    const [invoice, setInvoice] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchPendingInvoiceAndIntent = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('📝 Fetching Pending Monthly Invoice & Payment Intent');

                const { data } = await axiosInstance.post('/payments/renew-monthly', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data?.data?.clientSecret && data?.data?.invoice) {
                    setClientSecret(data.data.clientSecret);
                    setInvoice(data.data.invoice);
                    console.log('✅ Invoice & Client Secret received');
                } else {
                    throw new Error('Could not fetch invoice details. Please contact support.');
                }

            } catch (err: any) {
                console.error('❌ Failed to fetch invoice:', err);
                setError(err.response?.data?.message || 'Failed to establish payment session.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingInvoiceAndIntent();
    }, [token]);

    const handleLogout = () => {
        navigate('/login');
    };

    // overdue calculation
    const overdueDays = invoice?.dueDate
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 14; // Default fallback for visual consistency if date missing in demo

    const formattedDueDate = invoice?.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-GB').replace(/\//g, '.')
        : "20.05.2023"; // Default fallback for visual consistency

    return (
        <div
            className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col pt-12 px-4 pb-12"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

            {/* Header */}
            <div className="w-full max-w-6xl mx-auto relative z-10 flex items-center justify-center mb-10">
                <h1 className="text-4xl font-extrabold text-[#111827] text-center">
                    Payment Overdue
                </h1>
                <button
                    onClick={handleLogout}
                    className="absolute right-0 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-semibold"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            <div className="w-full max-w-6xl mx-auto relative z-10">
                {error && (
                    <div className="bg-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center py-20 px-4 border border-blue-50">
                        <div className="bg-green-50 rounded-full p-4 mb-4">
                            <Receipt className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Invoices</h2>
                        <p className="text-gray-600 text-center mb-8 max-w-md">
                            {error === 'No pending blocking invoice found.'
                                ? "You don't have any outstanding monthly invoices blocking your access."
                                : error || "It looks like you're all caught up! You have no outstanding invoices to settle."}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {isLoading && !error && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] shadow-xl border border-blue-50">
                        <Loader2 className="h-14 w-14 animate-spin text-blue-600 mb-6" />
                        <p className="text-gray-600 font-semibold text-lg">Preparing your overdue invoice summary...</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
                        {/* Left Column: Redesigned Overdue Summary */}
                        {invoice && (
                            <div className="bg-white rounded-[2rem] shadow-xl border border-blue-50/50 p-10 flex flex-col space-y-8 h-fit">
                                {/* Overdue Pill */}
                                <div>
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#B91C1C] text-sm font-bold border border-[#B91C1C]/20">
                                        <span className="w-2 h-2 rounded-full bg-[#B91C1C]"></span>
                                        Overdue – Action Required
                                    </span>
                                </div>

                                {/* Header with Alert Icon */}
                                <div className="flex gap-5">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 border border-[#B91C1C]/20 flex items-center justify-center shadow-sm">
                                        <AlertTriangle className="text-[#B91C1C] w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#7F1D1D] leading-tight">
                                            Payment Overdue – Immediate Action Required
                                        </h2>
                                        <p className="text-gray-500 mt-3 leading-relaxed text-[15px]">
                                            Your payment for the {invoice.billingMonth} period was due on {formattedDueDate}. Late fees may apply. Please clear your outstanding balance as soon as possible to avoid further penalties or service disruption.
                                        </p>
                                    </div>
                                </div>

                                {/* Balance Info Block */}
                                <div className="bg-[#FFF8F8] rounded-[1.5rem] p-8 flex justify-between items-end shadow-sm">
                                    <div className="space-y-1">
                                        <p className="text-[#64748B] text-[15px] mb-2">Total Outstanding Balance</p>
                                        <p className="text-[28px] font-semibold text-[#EF4444]">
                                            Rs. {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[#64748B] text-[14px] mt-4">
                                            {/* Includes platform fees + {invoice.employeeCount} active members */}
                                            Includes principal + Interest + Late fee
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-[#64748B] text-[15px] mb-2">Due Date</p>
                                        <p className="text-base font-semibold text-[#8B2222]">{formattedDueDate}</p>
                                        <p className="text-[#DC2626] text-[14px] mt-2">{overdueDays} days overdue</p>
                                    </div>
                                </div>

                                {/* Footer Button */}
                                <button className="w-full py-5 rounded-2xl border border-blue-100 text-blue-500 font-normal hover:bg-blue-50 transition-all mt-auto active:scale-[0.98]">
                                    Contact Support
                                </button>
                            </div>
                        )}

                        {/* Right Column: Stripe Checkout Form */}
                        <div className="bg-white rounded-[2rem] shadow-xl p-10 flex flex-col border border-blue-50">
                            <div className="mb-10 text-center space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">Secure Payment via Stripe</h2>
                                <p className="text-gray-500 text-[15px]">
                                    Select your preferred payment method and enter your card details to clear the balance.
                                </p>
                            </div>

                            <div className="flex-1">
                                {clientSecret && invoice && (
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <CheckoutForm
                                            amount={invoice.totalAmount}
                                            currency="LKR"
                                        />
                                    </Elements>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Background Wave - Bottom Right */}
            <div
                className="absolute bottom-[-350px] right-[-200px] w-[700px] h-[700px] z-0 pointer-events-none"
            >
                <img
                    src={bgIllustration}
                    alt="Background Wave"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
};

export default SettleInvoice;
