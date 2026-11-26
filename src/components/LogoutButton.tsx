import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useLogout } from '../hooks/useLogout';

interface LogoutButtonProps {
    /** Extra positioning classes (e.g. fixed top-right). */
    className?: string;
}

/** "Log Out" for onboarding pages (/get-plan, /set-company); hidden when nobody is signed in. */
const LogoutButton = ({ className = '' }: LogoutButtonProps): JSX.Element | null => {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const performLogout = useLogout();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!isAuthenticated) return null;

    const handleClick = async (): Promise<void> => {
        setIsLoggingOut(true);
        await performLogout();
    };

    return (
        <button
            type="button"
            onClick={(): void => { void handleClick(); }}
            disabled={isLoggingOut}
            className={`z-50 flex items-center gap-1.5 text-sm text-gray-700 hover:text-red-600 border-2 border-gray-200 hover:border-red-300 bg-white/80 hover:bg-red-50 transition px-4 py-2 rounded-full disabled:opacity-60 ${className}`}
        >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Log Out
        </button>
    );
};

export default LogoutButton;
