import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    icon: LucideIcon;
    title: string;
    description: string;
    bgColor: string; // The icon text color e.g. text-blue-500
    lightBgColor: string; // The icon background color e.g. bg-blue-50
    onClick?: () => void;
}

const QuickAction = ({
    icon: Icon,
    title,
    description,
    bgColor,
    lightBgColor,
    onClick
}: QuickActionProps) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-full text-left bg-[#F4F9FF] p-3 rounded-2xl flex items-center gap-5 
                border border-transparent hover:border-gray-200 transition-all 
                hover:shadow-sm group
            `}
        >
            <div className={`${lightBgColor} p-3.5 rounded-xl shrink-0 transition-transform group-hover:scale-105`}>
                <Icon className={`w-4 h-4 ${bgColor}`} />
            </div>
            
            <div className="flex-1">
                <h3 className="text-[12px] font-bold text-gray-900 leading-tight">
                    {title}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                    {description}
                </p>
            </div>
        </button>
    );
};

export default QuickAction;
