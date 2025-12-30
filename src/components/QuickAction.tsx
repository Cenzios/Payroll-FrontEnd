import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    icon: LucideIcon;
    title: string;
    description: string;
    bgColor: string;
    onClick?: () => void;
}

const QuickAction = ({
    icon: Icon,
    title,
    description,
    bgColor,
    onClick
}: QuickActionProps) => {
    return (
        <button
            onClick={onClick}
            className={`${bgColor} p-6 rounded-xl text-left hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md w-full`}
        >
            <div className="flex flex-col gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg w-fit">
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <div className="text-white font-semibold text-lg">{title}</div>
                    <div className="text-white text-opacity-90 text-sm mt-1">
                        {description}
                    </div>
                </div>
            </div>
        </button>
    );
};

export default QuickAction;
