import { useNavigate } from 'react-router-dom';
import { Crown, ShieldCheck, Users, Calendar, ExternalLink, RefreshCcw } from 'lucide-react';
import { useGetSubscriptionQuery } from '../../store/apiSlice';
import PaymentPlanSkeleton from '../../components/skeletons/PaymentPlanSkeleton';
import logo from '../../assets/images/logo.svg';

const SubscriptionSection = () => {
    const navigate = useNavigate();
    const { data: subscription, isLoading: loading } = useGetSubscriptionQuery();

    return (
        <section className="mt-8">
            <div className="mb-6">
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
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-700">
                            <Crown className="h-24 w-24 text-blue-600" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
                                            <ShieldCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="flex items-center gap-3">
                                                <img
                                                    src={logo}
                                                    alt="Payroll Logo"
                                                    className="h-8 object-contain"
                                                />

                                                <span className="bg-blue-600 text-white text-[16px] font-bold px-6 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                                    {subscription.planName} Plan
                                                </span>
                                            </h4>
                                            <div className="flex items-center gap-2 text-blue-600 font-medium mt-1">
                                                <span className="text-sm font-semibold">Rs</span>
                                                <span className="text-xl">{subscription.pricePerEmployee}</span>
                                                <span className="text-sm text-gray-400 font-normal">/per employee</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span className="text-xs text-gray-400">Total Employees:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {subscription.usedEmployees} / {subscription.totalAllowedEmployees}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span className="text-xs text-gray-400">Next Billing:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {new Date(subscription.nextBillingDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                                <button className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all order-2 sm:order-1 capitalize whitespace-nowrap">
                                    Cancel plan
                                </button>
                                <button
                                    onClick={() => navigate('/get-plan?isPlanChange=true')}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 shadow-lg shadow-blue-100 whitespace-nowrap"
                                >
                                    Change Plan <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <RefreshCcw className="h-3 w-3" /> Auto-renewal is enabled for this subscription
                    </div>
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
