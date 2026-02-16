import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  showLastMonth?: boolean;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  showLastMonth = false,
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

  return (
    <div
      className="
      relative
      rounded-[2rem]
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
      group
    "
    >
      {/* Month Label */}
      <div className="absolute top-5 right-6 text-sm font-semibold text-blue-500">
        {monthLabel}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110">
        <Icon className="w-6 h-6 text-blue-700" />
      </div>

      {/* Title */}
      <div className="text-sm text-gray-700 mb-1 font-semibold">
        {title}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-gray-900">
        {value}
      </div>
    </div>
  );
};

export default StatCard;
