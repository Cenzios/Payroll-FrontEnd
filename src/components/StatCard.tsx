import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle = 'Latest Month',
}: StatCardProps) => {
  return (
    <div className="
      relative
      rounded-2xl
      p-6
      bg-gradient-to-br
      from-blue-100/90
      via-indigo-100/80
      to-sky-100/90
      backdrop-blur-xl
      border border-blue-200/60
      shadow-sm
      hover:shadow-lg
      hover:shadow-blue-200/40
      transition-all
    ">
      {/* Top Right */}
      <div className="absolute top-4 right-4 text-xs text-gray-600">
        {subtitle}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-blue-200/80 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-700" />
      </div>

      {/* Title */}
      <div className="text-sm text-gray-700 mb-1 font-medium">
        {title}
      </div>

      {/* Value */}
      <div className="text-2xl font-medium text-gray-900">
        {value}
      </div>
    </div>
  );
};

export default StatCard;
