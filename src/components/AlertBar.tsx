import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../api/axios";
import { useAppSelector } from "../store/hooks";


const AlertBar = () => {
    const navigate = useNavigate();
    const { user, token } = useAppSelector((state) => state.auth);

    const [remainingDays, setRemainingDays] = useState(7);
    const [isTrial, setIsTrial] = useState<boolean | null>(null);
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
            } else {
                setIsTrial(false);
            }
        };

        if (token) checkTrialStatus();
    }, [token, navigate, user]);

    // // TRIAL EXPIRE LOCK
    // // body attribute effect
    // useEffect(() => {
    //     if (isTrial && remainingDays <= 0) {
    //         document.body.setAttribute('data-trial-expired', 'true');
    //     } else {
    //         document.body.removeAttribute('data-trial-expired');
    //     }
    // }, [isTrial, remainingDays]);

    // //  global interceptor effect
    // useEffect(() => {
    //     const handleGlobalClick = (e: MouseEvent) => {
    //         if (document.body.getAttribute('data-trial-expired') !== 'true') return;
    //         const target = e.target as HTMLElement;
    //         const isSidebarLink = target.closest('[data-sidebar-nav]');
    //         if (isSidebarLink) return;
    //         const isUpgradeBtn = target.closest('[data-upgrade-btn]');
    //         if (isUpgradeBtn) return;
    //         const isInteractive = target.closest(
    //             'button, a:not([data-sidebar-nav] a), input, select, textarea, [role="button"], [role="checkbox"], [role="switch"]'
    //         );
    //         if (isInteractive) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             window.dispatchEvent(new CustomEvent('open-renew-modal'));
    //         }
    //     };

    //     const handleGlobalKeydown = (e: KeyboardEvent) => {
    //         if (document.body.getAttribute('data-trial-expired') !== 'true') return;
    //         const target = e.target as HTMLElement;
    //         if (target.closest('input, textarea, select')) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //         }
    //     };

    //     const handleGlobalChange = (e: Event) => {
    //         if (document.body.getAttribute('data-trial-expired') !== 'true') return;
    //         e.preventDefault();
    //         e.stopPropagation();
    //         window.dispatchEvent(new CustomEvent('open-renew-modal'));
    //     };

    //     document.addEventListener('click', handleGlobalClick, true);
    //     document.addEventListener('keydown', handleGlobalKeydown, true);
    //     document.addEventListener('change', handleGlobalChange, true);

    //     return () => {
    //         document.removeEventListener('click', handleGlobalClick, true);
    //         document.removeEventListener('keydown', handleGlobalKeydown, true);
    //         document.removeEventListener('change', handleGlobalChange, true);
    //     };
    // }, []);

    const [isCheckingDocs, setIsCheckingDocs] = useState(false);

    // ✅ Handle Upgrade Now click:
    // If subscription is PENDING_ACTIVATION AND they uploaded a slip → show PlanVerify
    // Otherwise → go to plan selection flow
    const handleUpgradeNow = async () => {
        if (subscriptionStatus === 'PENDING_ACTIVATION') {
            setIsCheckingDocs(true);
            try {
                const { data } = await axiosInstance.get('/user-documents');
                // Check if any document is currently pending review
                const hasPendingDoc = data.data?.some((doc: any) => doc.status === 'PENDING');

                if (hasPendingDoc) {
                    navigate('/plan-verify');
                    return;
                }
            } catch (err) {
                console.warn('Document check failed, defaulting to plan selection');
            } finally {
                setIsCheckingDocs(false);
            }
        }
        navigate('/get-plan?isUpgrade=true');
    };

    return (
        <div>
            {/* prevent layout shift */}
            {/* {isTrial === null && (
                <div className="h-7 w-full bg-[#438FEF]/20 animate-pulse" />
            )} */}

            {isTrial === true && (
                <div className='flex shrink-0 items-center justify-center relative py-1 bg-[#438FEF] text-[11px] text-white h-7 w-full z-50 gap-2 tracking-wider'>
                    <p className="text-white">
                        {remainingDays <= 0 ? 'Your trial period has ended. ' : 'Heads Up! Your trial ends in'}
                        {remainingDays > 0 && (
                            <>
                                <span className="font-bold p-[2px] rounded-[4px] bg-orange-400 mx-2"> {remainingDays} </span>
                                Days
                            </>
                        )}
                    </p>
                    <span className='text-gray-600 text-2xl'>| </span>
                    <button
                        // // TRIAL EXPIRE LOCK
                        // data-upgrade-btn
                        onClick={handleUpgradeNow}
                        disabled={isCheckingDocs}
                        className='font-extrabold underline cursor-pointer disabled:opacity-70'>
                        {isCheckingDocs ? 'Checking status...' : 'Upgrade Now'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default AlertBar;

