import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    icon: LucideIcon;
    title: string;
    description: string;
    bgColor: string; // This will now be the icon/button color
    lightBgColor: string; // This will be the card background color
    actionText: string;
    onClick?: () => void;
}

const QuickAction = ({
    icon: Icon,
    title,
    description,
    bgColor,
    lightBgColor,
    actionText,
    onClick
}: QuickActionProps) => {
    return (
        <div className={`${lightBgColor} p-6 rounded-2xl flex flex-col h-full border border-transparent shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-start gap-4 mb-6">
                <div className={`${bgColor} p-3 rounded-xl shadow-sm flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
                        {title}
                    </h3>
                    <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <button
                onClick={onClick}
                className={`
                    w-full py-2.5 rounded-xl text-white font-semibold text-sm
                    ${bgColor} hover:opacity-90 transition-all active:scale-[0.98]
                    shadow-sm mt-auto
                `}
            >
                {actionText}
            </button>
        </div>
    );
};

export default QuickAction;
