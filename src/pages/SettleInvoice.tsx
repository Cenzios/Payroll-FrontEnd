import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Loader2, Receipt, Calendar, Users, LogOut } from 'lucide-react';
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

    return (
        <div
            className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col pt-12 px-4 pb-12"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]"></div>

            {/* Header */}
            <div className="w-full max-w-5xl mx-auto relative z-10 flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    Settle Unpaid Invoice
                </h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            <div className="w-full max-w-5xl mx-auto relative z-10">
                {error && (
                    <div className="bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center py-16 px-4">
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
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {isLoading && !error && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-xl">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600 font-medium">Preparing your invoice summary...</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                        {/* Left Column: Invoice Summary */}
                        {invoice && (
                            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden flex flex-col">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-90" />
                                    <h2 className="text-2xl font-bold">Outstanding Invoice</h2>
                                    <p className="text-blue-100 mt-1">Please settle this balance to continue accessing the dashboard.</p>
                                </div>

                                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Calendar className="w-5 h-5 text-blue-500" />
                                                <span className="font-medium">Billing Period</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{invoice.billingMonth}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Users className="w-5 h-5 text-blue-500" />
                                                <span className="font-medium">Billed Employees</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{invoice.employeeCount} Members</span>
                                        </div>

                                        {invoice.plan && (
                                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 ml-8 text-sm">Price per employee</span>
                                                <span className="font-medium text-gray-700 text-sm">LKR {invoice.plan.employeePrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-gray-700">Total Due</span>
                                            <span className="text-3xl font-bold text-blue-700">
                                                LKR {invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Right Column: Stripe Checkout Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
                            <div className="mb-8 text-center space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900">Secure Payment via Stripe</h2>
                                <p className="text-gray-600 text-sm">
                                    Enter your card details to clear the outstanding balance.
                                </p>
                            </div>

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
