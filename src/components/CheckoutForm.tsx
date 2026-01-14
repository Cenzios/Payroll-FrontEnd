import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
    amount: number;
    currency: string;
}

const CheckoutForm = ({ amount, currency }: CheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL where the customer should be redirected after the payment
                return_url: `${window.location.origin}/confirmation`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
            setIsProcessing(false);
        } else {
            // The UI will likely redirect before this code executes
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <PaymentElement />
            </div>

            {errorMessage && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Processing...
                    </>
                ) : (
                    `Pay ${currency} ${amount.toFixed(2)}`
                )}
            </button>

            <div className="flex justify-center gap-6 text-xs text-gray-500 mt-4">
                <div className="flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-1 rounded">Test Card: 4242 4242 4242 4242</span>
                </div>
            </div>
        </form>
    );
};

export default CheckoutForm;
