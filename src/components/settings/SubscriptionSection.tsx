import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ShieldCheck, Users, Calendar, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useGetSubscriptionQuery, useCancelSubscriptionMutation } from '../../store/apiSlice';
import PaymentPlanSkeleton from '../../components/skeletons/PaymentPlanSkeleton';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import logo from '../../assets/images/logo-login.svg';

const SubscriptionSection = () => {
    const navigate = useNavigate();
    const { data: subscription, isLoading: loading, refetch } = useGetSubscriptionQuery();
    const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleCancelPlan = async () => {
        try {
            await cancelSubscription().unwrap();
            setShowCancelModal(false);
            // Refetch subscription to show updated state (CANCELLED with future endDate)
            refetch();
            setToast({
                message: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.',
                type: 'success'
            });
        } catch (error: any) {
            setToast({ message: error?.data?.message || 'Failed to cancel subscription', type: 'error' });
            setShowCancelModal(false);
        }
    };

    const isCancelled = (subscription as any)?.isCancelled === true;
    const cancelledEndDate = (subscription as any)?.cancelledEndDate
        ? new Date((subscription as any).cancelledEndDate)
        : null;

    return (
        <section className="mt-8 max-sm:mt-2">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelPlan}
                title="Cancel Subscription"
                message="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle."
                confirmText={isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                cancelText="Keep Subscription"
                variant="danger"
            />

            <div className="mb-6 max-sm:mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-blue-600" />
                    Subscription Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">Manage your subscription plan here.</p>
            </div>

            {loading ? (
                <PaymentPlanSkeleton />
            ) : subscription ? (
                <>
                    {/* Cancellation scheduled banner */}
                    {isCancelled && cancelledEndDate && (
                        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl">
                            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-amber-500" />
                            <div>
                                <p className="font-semibold text-sm">Cancellation Scheduled</p>
                                <p className="text-xs mt-0.5">
                                    Your subscription has been cancelled. You will continue to have full access until{' '}
                                    <span className="font-bold">
                                        {cancelledEndDate.toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    . After that date, you will be redirected to select a new plan.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden group max-sm:rounded-2xl max-sm:p-5 max-sm:shadow-none max-sm:border-gray-200">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-700">
                            <Crown className="h-24 w-24 text-blue-600" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 max-sm:gap-4">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100 max-sm:p-2">
                                            <ShieldCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="flex items-center gap-14">
                                                <img
                                                    src={logo}
                                                    alt="Payroll Logo"
                                                    className="h-8 object-contain"
                                                />

                                                <span className={`text-[16px] font-bold px-6 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap 
                                                max-sm:self-start max-sm:justify-end max-sm:text-[10px] max-sm:px-3 max-sm:py-0.5 ${isCancelled
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-600 text-white'
                                                    }`}>
                                                    {subscription.planName} Plan{isCancelled ? ' (Cancelled)' : ''}
                                                </span>
                                            </h4>
                                            <div className="flex items-center gap-2 text-blue-600 font-medium mt-1 max-sm:hidden">
                                                <span className="text-sm font-semibold">Rs</span>
                                                <span className="text-xl">{subscription.pricePerEmployee}</span>
                                                <span className="text-sm text-gray-400 font-normal">/per employee</span>
                                            </div>
                                            {/* Mobile price*/}
                                            <div className="hidden max-sm:flex flex-col items-end">
                                                <span className="text-sm font-bold text-gray-900">RS: {subscription.pricePerEmployee}</span>
                                                <span className="text-[11px] text-gray-400">/per employee</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1 max-sm:gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-1 whitespace-nowrap max-sm:whitespace-normal">
                                            <span className="text-xs text-gray-400">Total Employees:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {subscription.usedEmployees}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-1 whitespace-nowrap max-sm:whitespace-normal">
                                            <span className="text-xs text-gray-400">
                                                {isCancelled ? 'Access Until:' : 'Next Billing:'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {isCancelled && cancelledEndDate
                                                    ? cancelledEndDate.toLocaleDateString()
                                                    : new Date(subscription.nextBillingDate).toLocaleDateString()
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Only show Cancel button if not already cancelled */}
                            {!isCancelled && (
                                <div className="relative z-10 flex flex-col sm:flex-row gap-3 max-sm:w-full max-sm:mt-2">
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={isCancelling}
                                        className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all order-2 sm:order-1 capitalize whitespace-nowrap disabled:opacity-50 max-sm:bg-blue-600 max-sm:text-white"
                                    >
                                        {isCancelling ? 'Cancelling...' : 'Cancel plan'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isCancelled && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <RefreshCcw className="h-3 w-3" /> Auto-renewal is enabled for this subscription
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                    <p className="text-gray-400 text-sm">No active subscription found</p>
                </div>
            )}
        </section>
    );
};

export default SubscriptionSection;
