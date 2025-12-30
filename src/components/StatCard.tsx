import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    subtitle?: string;
    iconBgColor: string;
    iconColor: string;
}

const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    iconBgColor,
    iconColor
}: StatCardProps) => {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            {subtitle && (
                <div className="text-xs text-gray-500 mb-2">{subtitle}</div>
            )}
            <div className="flex items-center gap-4">
                <div className={`${iconBgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">{title}</div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
