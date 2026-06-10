import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import axiosInstance from '../api/axios';
import { PLANS, getPlanById } from '../constants/plans';

const PlanPaymentPayhere = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
    const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

    const handlePayhere = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await axiosInstance.post('/payments/payhere/hash', {
                planId: selectedPlan.id,
                amount: selectedPlan.registrationFee,
            });

            const checkout = data.data;

            // Build and submit form to PayHere
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = checkout.checkoutUrl;

            const fields: Record<string, string> = {
                merchant_id: checkout.merchantId,
                return_url: checkout.returnUrl,
                cancel_url: checkout.cancelUrl,
                notify_url: checkout.notifyUrl,
                order_id: checkout.orderId,
                items: selectedPlan.name,
                currency: checkout.currency,
                amount: checkout.amount,
                hash: checkout.hash,
                first_name: user?.fullName?.split(' ')[0] || 'Customer',
                last_name: user?.fullName?.split(' ')[1] || '-',
                email: user?.email || '',
                // phone: user?.phone || '0000000000',
                address: 'N/A',
                city: 'Colombo',
                country: 'Sri Lanka',
            };

            Object.entries(fields).forEach(([k, v]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = k;
                input.value = v;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate PayHere payment.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 flex flex-col gap-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Pay with PayHere</h2>
                <p className="text-gray-500 text-sm">
                    You'll be redirected to PayHere's secure checkout.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <button
                onClick={handlePayhere}
                disabled={isLoading}
                className="w-full bg-[#0C3080] text-white font-bold py-3 rounded-xl
                    flex items-center justify-center gap-2 transition-all
                    hover:bg-blue-800 active:scale-[0.98]
                    disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                    </>
                ) : (
                    'Pay Now with PayHere'
                )}
            </button>
        </div>
    );
};

export default PlanPaymentPayhere;