import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCountdown = useCallback(() => {
        setCountdown(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { setError('Email is required'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const contentType = res.headers.get('content-type');
            let data: any = null;

            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            }

            if (!res.ok) {
                const errMsg = data?.message || (res.status === 404 ? 'No account found with this email address.' : 'Something went wrong. Please try again.');
                throw new Error(errMsg);
            }

            if (data && !data.success) {
                throw new Error(data.message);
            }

            setSent(true);
            startCountdown();
        } catch (err: any) {
            if (err instanceof SyntaxError || err.message?.includes('is not valid JSON') || err.message?.includes('Unexpected token')) {
                setError('No account found with this email address.');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error('Failed to resend');
            startCountdown();
        } catch {
            // silently fail – user can retry after timer
        } finally {
            setIsResending(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout title="Check Your Email">
                <div className="mb-6 text-center">
                    <p className="text-gray-600">
                        We've sent a password reset link to
                    </p>
                    <p className="text-blue-600 font-medium mt-1">
                        {email}
                    </p>

                    <div className="my-4 flex items-center justify-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-center gap-3">
                                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        Check your inbox to reset your password.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-3">
                            Didn't receive the email?
                        </p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0 || isResending}
                            className="w-full bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                       max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:text-white max-sm:border-0 max-sm:shadow-blue-200">
                            {isResending
                                ? 'Sending...'
                                : countdown > 0
                                    ? `Resend available in ${countdown}s`
                                    : 'Resend Forgot Password Link'}
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Back to Sign In Page
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="Enter your email and we'll send you a reset link."
        >

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 max-sm:px-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className={`block w-full pl-10 pr-3 py-3 border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                            placeholder="you@example.com"
                            autoFocus
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3A8BFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#337AEB] focus:outline-none focus:ring-2 focus:ring-[#3A8BFF] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
            max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200"
                >
                    {isLoading ? (
                        <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />Sending...</>
                    ) : (
                        <>Send Reset Link <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Back to Sign In Page
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ForgotPassword;