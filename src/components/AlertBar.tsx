import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../api/axios";
import { useAppSelector } from "../store/hooks";


const AlertBar = () => {
    const navigate = useNavigate();
    const { user, selectedCompanyId, token } = useAppSelector((state) => state.auth);

    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [remainingDays, setRemainingDays] = useState(7);
    const [isTrial, setIsTrial] = useState(false);

    // ✅ 2. Robust Trial Status & Banner Logic
    useEffect(() => {
        const checkTrialStatus = async () => {
            try {
                const { data } = await axiosInstance.get('/subscription/current');
                if (data?.data) {
                    setActiveSubscription(data.data);
                    const isTrialUser = data.data.isTrialUser;

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
            // Fallback to User model's isTrialUser and createdAt
            if (user?.isTrialUser) {
                setIsTrial(true);
                // Use user.createdAt if available (from DB), otherwise assume just started
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

    return (
        <div>
            {isTrial && (
                <div className='flex shrink-0 items-center justify-center relative py-1 bg-[#438FEF] text-[11px] text-white h-7 w-full z-50 gap-2 tracking-wider'>
                    {/* <AlertTriangle className="w-5 h-5" /> */}
                    <p className="text-white">Heads Up! Your trial ends in
                        <span className="font-bold p-[2px] rounded-[4px] bg-orange-400 mx-2"> {remainingDays > 0 ? remainingDays : 0} </span>
                        Days</p>
                    <span className='text-gray-600 text-2xl'> | </span>
                    <button
                        onClick={() => navigate('/get-plan?isUpgrade=true')}
                        className='font-extrabold underline cursor-pointer'>
                        Upgrade Now</button>
                </div>
            )}
        </div>

    );
}

export default AlertBar;
