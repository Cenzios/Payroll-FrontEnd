import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';

export const useTrialStatus = () => {
    const { user } = useAppSelector((state) => state.auth);

    const isTrialExpired = useMemo(() => {
        if (!user || !(user as any).isTrialUser) {
            return false;
        }

        const createdAtStr = (user as any).createdAt;
        if (!createdAtStr) return false;

        const signupDate = new Date(createdAtStr);
        const now = new Date();
        const diffTime = now.getTime() - signupDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remDays = 7 - diffDays;

        return remDays <= 0;
    }, [user]);

    const handleTrialAction = (e: React.MouseEvent | React.KeyboardEvent | Event, callback?: () => void) => {
        if (isTrialExpired) {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('open-trial-upgrade-modal'));
            return;
        }

        if (callback) {
            callback();
        }
    };

    return {
        isTrialExpired,
        handleTrialAction
    };
};
