import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token') || '';

    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
    const [apiError, setApiError] = useState('');

    const validate = () => {
        const e = { password: '', confirmPassword: '' };
        if (!formData.password) e.password = 'Password is required';
        else if (formData.password.length < 6) e.password = 'At least 6 characters';
        if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return !e.password && !e.confirmPassword;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (!resetToken) {
            setApiError('Invalid or missing reset token. Please request a new link.');
            return;
        }

        setIsLoading(true);
        setApiError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, password: formData.password }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            navigate('/login', { replace: true });
        } catch (err: any) {
            setApiError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Set New Password"
            subtitle="Choose a strong password for your account."
        >
            <p className='text-xs text-gray-500 mb-8 -mt-8'>(Ex: Minimum 6 characters including Uppercase Letters, Lowercase Letters, Numbers and Special Characters.)</p>
            {apiError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {apiError}{' '}
                    {apiError.includes('expired') && (
                        <button onClick={() => navigate('/forgot-password')} className="underline font-medium">
                            Request a new link
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 max-sm:px-5">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3A8BFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#337AEB] focus:outline-none focus:ring-2 focus:ring-[#3A8BFF] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
            max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200"
                >
                    {isLoading ? (
                        <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />Saving...</>
                    ) : 'Reset Password'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;