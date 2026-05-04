import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../api/axios";
import { useAppSelector } from "../store/hooks";


const AlertBar = () => {
    const navigate = useNavigate();
    const { user, token } = useAppSelector((state) => state.auth);

    const [remainingDays, setRemainingDays] = useState(7);
    const [isTrial, setIsTrial] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

    // ✅ Robust Trial Status & Banner Logic
    useEffect(() => {
        const checkTrialStatus = async () => {
            try {
                const { data } = await axiosInstance.get('/subscription/current');
                if (data?.data) {
                    const isTrialUser = data.data.isTrialUser;
                    setSubscriptionStatus(data.data.status ?? null);

                    if (isTrialUser) {
                        setIsTrial(true);
                        const createdDate = new Date(data.data.createdAt);
                        const now = new Date();
                        const diffTime = now.getTime() - createdDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const remDays = 7 - diffDays;
                        setRemainingDays(remDays > 0 ? remDays : 0);

                        if (remDays <= 0) {
                            navigate('/buy-plan?isUpgrade=true');
                        }
                    } else {
                        setIsTrial(false);
                    }
                } else {
                    handleTrialFallback();
                }
            } catch (err) {
                console.warn('Subscription fetch failed, falling back to User-based trial logic');
                handleTrialFallback();
            }
        };

        const handleTrialFallback = () => {
            if (user?.isTrialUser) {
                setIsTrial(true);
                const signupDate = (user as any).createdAt ? new Date((user as any).createdAt) : new Date();
                const now = new Date();
                const diffTime = now.getTime() - signupDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const remDays = 7 - diffDays;
                setRemainingDays(remDays > 0 ? remDays : 0);

                if (remDays <= 0) {
                    navigate('/buy-plan?isUpgrade=true');
                }
            } else {
                setIsTrial(false);
            }
        };

        if (token) checkTrialStatus();
    }, [token, navigate, user]);

    // ✅ Handle Upgrade Now click:
    // If subscription is PENDING_ACTIVATION → user already submitted payment, show PlanVerify
    // Otherwise → go to plan selection flow
    const handleUpgradeNow = () => {
        if (subscriptionStatus === 'PENDING_ACTIVATION') {
            navigate('/plan-verify');
        } else {
            navigate('/get-plan?isUpgrade=true');
        }
    };

    return (
        <div>
            {isTrial && (
                <div className='flex shrink-0 items-center justify-center relative py-1 bg-[#438FEF] text-[11px] text-white h-7 w-full z-50 gap-2 tracking-wider'>
                    <p className="text-white">Heads Up! Your trial ends in
                        <span className="font-bold p-[2px] rounded-[4px] bg-orange-400 mx-2"> {remainingDays > 0 ? remainingDays : 0} </span>
                        Days</p>
                    <span className='text-gray-600 text-2xl'>| </span>
                    <button
                        onClick={handleUpgradeNow}
                        className='font-extrabold underline cursor-pointer'>
                        Upgrade Now</button>
                </div>
            )}
        </div>
    );
}

export default AlertBar;

