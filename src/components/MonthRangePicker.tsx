import React from 'react';

interface MonthRangePickerProps {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    onStartChange: (month: number, year: number) => void;
    onEndChange: (month: number, year: number) => void;
    className?: string;
}

const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
    startMonth,
    startYear,
    endMonth,
    endYear,
    onStartChange,
    onEndChange,
    className = ''
}) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Start Date */}
            <div className="flex gap-2">
                <select
                    value={startMonth}
                    onChange={(e) => onStartChange(parseInt(e.target.value), startYear)}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                    {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                    ))}
                </select>
                <select
                    value={startYear}
                    onChange={(e) => onStartChange(startMonth, parseInt(e.target.value))}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                    {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Separator */}
            <div className="flex items-center text-gray-400 font-medium">→</div>

            {/* End Date */}
            <div className="flex gap-2">
                <select
                    value={endMonth}
                    onChange={(e) => onEndChange(parseInt(e.target.value), endYear)}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                    {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                    ))}
                </select>
                <select
                    value={endYear}
                    onChange={(e) => onEndChange(endMonth, parseInt(e.target.value))}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                    {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default MonthRangePicker;
