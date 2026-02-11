import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    icon: LucideIcon;
    title: string;
    description: string;
    bgColor: string;
    btnColor: string;
    btnText: string;
    onClick?: () => void;
}

const QuickAction = ({
    icon: Icon,
    title,
    description,
    bgColor,
    btnColor,
    btnText,
    onClick
}: QuickActionProps) => {
    return (
        <div className={`${bgColor} p-6 rounded-[2rem] flex flex-col h-full shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0 flex items-center justify-center w-12 h-12">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h4 className="text-[17px] font-bold text-gray-900">{title}</h4>
                    <p className="text-[14px] text-gray-500 font-medium leading-snug">{description}</p>
                </div>
            </div>

            <button
                onClick={onClick}
                className={`mt-auto w-full py-2.5 rounded-xl ${btnColor} text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm`}
            >
                {btnText}
            </button>
        </div>
    );
};

export default QuickAction;
