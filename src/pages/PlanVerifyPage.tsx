import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { PLANS, getPlanById } from '../constants/plans';
import PlanCard from '../components/PlanCard';
import PlanVerify from '../components/PlanVerify';
import { Loader2 } from 'lucide-react';

const PlanVerifyPage = () => {
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [referenceId, setReferenceId] = useState<string | undefined>(undefined);


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch subscription to get plan info
                const subRes = await axiosInstance.get('/subscription/current');
                if (subRes.data?.data) {
                    setActiveSubscription(subRes.data.data);
                }

                // Fetch pending document for referenceId
                const docRes = await axiosInstance.get('/user-documents');
                const pendingDoc = docRes.data?.data?.find((doc: any) => doc.status === 'PENDING');
                if (pendingDoc?.referenceId) {
                    setReferenceId(pendingDoc.referenceId);
                }
            } catch (err) {
                console.warn('Failed to fetch data for PlanVerifyPage', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedPlanId = localStorage.getItem('reg_planId') || PLANS.BASIC.id;
    const selectedPlan = getPlanById(selectedPlanId) || PLANS.BASIC;

    const planName = activeSubscription?.planName || selectedPlan.name;
    const planPrice = activeSubscription?.pricePerEmployee || selectedPlan.employeePrice || selectedPlan.price;
    const planFeatures = selectedPlan.features;

    return (
        <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-10 scroll-smooth">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,131,248,0.35),transparent_70%)]" />

            <div className="w-full max-w-5xl relative z-10">
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
                    Complete Registration Payment
                </h1>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl shadow-xl">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600 font-medium">Loading your plan details...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[1fr_1fr] gap-10">
                        {/* Left — Plan Card */}
                        <PlanCard
                            planName={planName}
                            price={planPrice}
                            description={selectedPlan.description}
                            features={planFeatures}
                            isHighlighted={true}
                            showButton={false}
                        />

                        {/* Right — Verification Pending card */}
                        <PlanVerify referenceId={referenceId} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanVerifyPage;

