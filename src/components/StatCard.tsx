import { LucideIcon } from "lucide-react";

export type StatColorTheme = 'blue' | 'green' | 'purple' | 'orange';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  showLastMonth?: boolean;
  colorTheme?: StatColorTheme;
}

const themeStyles: Record<StatColorTheme, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-500', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-500', dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-500', dot: 'bg-orange-500' },
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  showLastMonth = false,
  colorTheme = 'blue',
}: StatCardProps) => {
  const now = new Date();

  let monthIndex = now.getMonth();
  let year = now.getFullYear();

  if (showLastMonth) {
    if (monthIndex === 0) {
      monthIndex = 11;
      year = year - 1;
    } else {
      monthIndex = monthIndex - 1;
    }
  }

  const displayDate = new Date(year, monthIndex);

  const monthLabel = displayDate.toLocaleString("default", { month: "short" });
  const yearLabel = displayDate.getFullYear();

  const themeStyle = themeStyles[colorTheme];

  return (
    <div className="relative rounded-lg p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">

      {/* Date Badge — top-right corner, matching the screenshot style */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className={`w-[7px] h-[7px] rounded-full ${themeStyle.dot} shrink-0`} />
        <span className="text-[11px] font-medium text-gray-400">
          {monthLabel} {yearLabel}
        </span>
      </div>

      {/* Left Content */}
      <div>
        <div className="text-[11px] text-gray-500 mb-1 font-regular">
          {title}
        </div>
        <div className="text-[20px] font-bold text-gray-900 leading-none">
          {value}
        </div>
      </div>

      {/* Right Icon */}
      <div className={`w-12 h-12 rounded-xl ${themeStyle.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
        <Icon className={`w-5 h-5 ${themeStyle.text}`} />
      </div>

    </div>
  );
};

export default StatCard;