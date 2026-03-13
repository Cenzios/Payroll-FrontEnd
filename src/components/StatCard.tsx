import { LucideIcon } from "lucide-react";

export type StatColorTheme = 'blue' | 'green' | 'purple' | 'orange';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  showLastMonth?: boolean;
  colorTheme?: StatColorTheme;
}

const themeStyles: Record<StatColorTheme, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-500' },
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

  // If this card should show last month
  if (showLastMonth) {
    if (monthIndex === 0) {
      // If January → go to December previous year
      monthIndex = 11;
      year = year - 1;
    } else {
      monthIndex = monthIndex - 1;
    }
  }

  const displayDate = new Date(year, monthIndex);

  const monthLabel = displayDate.toLocaleString("default", {
    month: "short",
  });

  const themeStyle = themeStyles[colorTheme];

  return (
    <div
      className="
      relative
      rounded-lg
      p-6
      bg-white
      border border-gray-100
      shadow-sm
      hover:shadow-md
      transition-all
      group
      flex items-center justify-between
    "
    >
      {/* Month Label (Hidden globally if not explicitly desired, but standardizing to the corner if needed. 
          The mockup doesn't explicitly show month labels for all, but let's keep it if showLastMonth is true or remove? 
          Actually, the mockup doesn't show month labels on the cards, but we'll leave it out of the way or keep it as subtle text.) */}
      {showLastMonth && (
         <div className="absolute top-4 right-4 text-[11px] font-semibold text-gray-400">
           {monthLabel}
         </div>
      )}

      {/* Left Content */}
      <div>
        {/* Title */}
        <div className="text-[11px] text-gray-500 mb-1 font-regular">
          {title}
        </div>
        
        {/* Value */}
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
