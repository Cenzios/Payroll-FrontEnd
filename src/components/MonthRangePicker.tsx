import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartMonth, setTempStartMonth] = useState(startMonth);
    const [tempStartYear, setTempStartYear] = useState(startYear);
    const [tempEndMonth, setTempEndMonth] = useState(endMonth);
    const [tempEndYear, setTempEndYear] = useState(endYear);
    const [startPanelYear, setStartPanelYear] = useState(startYear);
    const [endPanelYear, setEndPanelYear] = useState(endYear);
    const popupRef = useRef<HTMLDivElement>(null);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthsFull = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Close popup and apply changes when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                // Validate and apply the range
                const startDate = tempStartYear * 12 + tempStartMonth;
                const endDate = tempEndYear * 12 + tempEndMonth;
                const currentDateValue = currentYear * 12 + currentMonth;

                // Check if range is valid
                if (startDate <= endDate && endDate <= currentDateValue) {
                    // Apply the changes
                    onStartChange(tempStartMonth, tempStartYear);
                    onEndChange(tempEndMonth, tempEndYear);
                }
                // Close popup regardless
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, tempStartMonth, tempStartYear, tempEndMonth, tempEndYear, onStartChange, onEndChange, currentMonth, currentYear]);

    const formatDateRange = () => {
        const startMonthName = String(startMonth + 1).padStart(2, '0');
        const endMonthName = String(endMonth + 1).padStart(2, '0');
        return `${startMonthName}/${startYear} – ${endMonthName}/${endYear}`;
    };

    const handleOpen = () => {
        setTempStartMonth(startMonth);
        setTempStartYear(startYear);
        setTempEndMonth(endMonth);
        setTempEndYear(endYear);
        setStartPanelYear(startYear);
        setEndPanelYear(endYear);
        setIsOpen(true);
    };

    const handleStartMonthClick = (monthIndex: number) => {
        setTempStartMonth(monthIndex);
        setTempStartYear(startPanelYear);
    };

    const handleEndMonthClick = (monthIndex: number) => {
        setTempEndMonth(monthIndex);
        setTempEndYear(endPanelYear);
    };

    const isMonthSelected = (monthIndex: number, year: number, isStart: boolean) => {
        if (isStart) {
            return monthIndex === tempStartMonth && year === tempStartYear;
        } else {
            return monthIndex === tempEndMonth && year === tempEndYear;
        }
    };

    const isMonthInRange = (monthIndex: number, year: number) => {
        const currentDate = year * 12 + monthIndex;
        const startDate = tempStartYear * 12 + tempStartMonth;
        const endDate = tempEndYear * 12 + tempEndMonth;
        return currentDate >= startDate && currentDate <= endDate;
    };

    const isMonthDisabled = (monthIndex: number, year: number) => {
        // Disable months in the future (beyond current month)
        const monthDate = year * 12 + monthIndex;
        const currentDateValue = currentYear * 12 + currentMonth;
        return monthDate > currentDateValue;
    };

    return (
        <div className={`relative ${className}`} ref={popupRef}>
            {/* Input Field */}
            <div
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-gray-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{formatDateRange()}</span>
            </div>

            {/* Popup */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-6 w-[600px]">
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        {/* Start Month Panel */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setStartPanelYear(startPanelYear - 1)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="font-semibold text-gray-900">{startPanelYear}</span>
                                <button
                                    onClick={() => setStartPanelYear(startPanelYear + 1)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mb-2 font-medium">Start Date</div>
                            <div className="grid grid-cols-3 gap-2">
                                {months.map((month, index) => {
                                    const selected = isMonthSelected(index, startPanelYear, true);
                                    const inRange = isMonthInRange(index, startPanelYear);
                                    const disabled = isMonthDisabled(index, startPanelYear);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !disabled && handleStartMonthClick(index)}
                                            disabled={disabled}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${disabled
                                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                    : selected
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : inRange
                                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {month}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* End Month Panel */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setEndPanelYear(endPanelYear - 1)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="font-semibold text-gray-900">{endPanelYear}</span>
                                <button
                                    onClick={() => setEndPanelYear(endPanelYear + 1)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mb-2 font-medium">End Date</div>
                            <div className="grid grid-cols-3 gap-2">
                                {months.map((month, index) => {
                                    const selected = isMonthSelected(index, endPanelYear, false);
                                    const inRange = isMonthInRange(index, endPanelYear);
                                    const disabled = isMonthDisabled(index, endPanelYear);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !disabled && handleEndMonthClick(index)}
                                            disabled={disabled}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${disabled
                                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                    : selected
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : inRange
                                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {month}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Selected Range Display */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-medium mb-1">Selected Range</div>
                        <div className="text-sm text-blue-900 font-semibold">
                            {monthsFull[tempStartMonth]} {tempStartYear} – {monthsFull[tempEndMonth]} {tempEndYear}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Click outside to apply</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthRangePicker;
