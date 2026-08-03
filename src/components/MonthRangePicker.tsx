import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Toast from "../components/Toast";

interface MonthRangePickerProps {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    onStartChange: (month: number, year: number) => void;
    onEndChange: (month: number, year: number) => void;
    onApply?: (startMonth: number, startYear: number, endMonth: number, endYear: number) => void;
    className?: string;
}

const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
    startMonth,
    startYear,
    endMonth,
    endYear,
    onStartChange,
    onEndChange,
    onApply,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartMonth, setTempStartMonth] = useState(startMonth);
    const [tempEndMonth, setTempEndMonth] = useState(endMonth);
    const [startPanelYear, setStartPanelYear] = useState(startYear);
    const [endPanelYear, setEndPanelYear] = useState(endYear);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
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
                // const startDate = tempStartYear * 12 + tempStartMonth;
                // const endDate = tempEndYear * 12 + tempEndMonth;
                const startDate = startPanelYear * 12 + tempStartMonth;
                const endDate = endPanelYear * 12 + tempEndMonth;
                const currentDateValue = currentYear * 12 + currentMonth;

                // Check if range is valid
                if (startDate <= endDate && endDate <= currentDateValue) {
                    // Apply the changes
                    // onStartChange(tempStartMonth, tempStartYear);
                    // onEndChange(tempEndMonth, tempEndYear);
                    onStartChange(tempStartMonth, startPanelYear);
                    onEndChange(tempEndMonth, endPanelYear);
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
    }, [isOpen, tempStartMonth, tempEndMonth, startPanelYear, endPanelYear, onStartChange, onEndChange, currentMonth, currentYear]);

    const formatDateRange = () => {
        const startMonthName = String(startMonth + 1).padStart(2, '0');
        const endMonthName = String(endMonth + 1).padStart(2, '0');
        return `${startMonthName}/${startYear} – ${endMonthName}/${endYear}`;
    };

    const handleOpen = () => {
        setTempStartMonth(startMonth);
        setTempEndMonth(endMonth);
        setStartPanelYear(startYear);
        setEndPanelYear(endYear);
        setIsOpen(true);
    };

    const handleStartMonthClick = (monthIndex: number) => {
        setTempStartMonth(monthIndex);
        // setTempStartYear(startPanelYear);
    };

    const handleEndMonthClick = (monthIndex: number) => {
        setTempEndMonth(monthIndex);
        // setTempEndYear(endPanelYear);
    };

    const handleApplyClick = () => {
        // const startDate = tempStartYear * 12 + tempStartMonth;
        // const endDate = tempEndYear * 12 + tempEndMonth;
        const startDate = startPanelYear * 12 + tempStartMonth;
        const endDate = endPanelYear * 12 + tempEndMonth;
        const currentDateValue = currentYear * 12 + currentMonth;

        if (startDate > endDate) {
            setToast({ message: "Start date must be before end date", type: "error" });
            return;
        }
        if (endDate > currentDateValue) {
            setToast({ message: "Cannot select future months", type: "error" });
            return;
        }
        onStartChange(tempStartMonth, startPanelYear);
        onEndChange(tempEndMonth, endPanelYear);

        if (onApply) {
            onApply(tempStartMonth, startPanelYear, tempEndMonth, endPanelYear);
        }
        setIsOpen(false);
    };

    const isMonthSelected = (monthIndex: number, year: number, isStart: boolean) => {
        if (isStart) {
            // return monthIndex === tempStartMonth && year === tempStartYear;
            return monthIndex === tempStartMonth && year === startPanelYear;
        } else {
            // return monthIndex === tempEndMonth && year === tempEndYear;
            return monthIndex === tempEndMonth && year === endPanelYear;
        }
    };

    const isMonthInRange = (monthIndex: number, year: number) => {
        const currentDate = year * 12 + monthIndex;
        // const startDate = tempStartYear * 12 + tempStartMonth;
        // const endDate = tempEndYear * 12 + tempEndMonth;
        const startDate = startPanelYear * 12 + tempStartMonth;
        const endDate = endPanelYear * 12 + tempEndMonth;
        return currentDate >= startDate && currentDate <= endDate;
    };

    const isMonthDisabled = (monthIndex: number, year: number) => {
        // Disable months in the future (beyond current month)
        const monthDate = year * 12 + monthIndex;
        const currentDateValue = currentYear * 12 + currentMonth;
        return monthDate > currentDateValue;
    };

    return (
        <div className={`relative ${className}`}>
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
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:items-center sm:pt-0">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/20" />

                    <div
                        ref={popupRef}
                        className="relative bg-white border border-gray-200 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-[600px] max-h-[90vh] overflow-y-auto"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">

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
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-blue-900 font-semibold truncate">Selected Time Period</div>
                                <div className="text-sm text-blue-900 font-semibold">
                                    {/* {monthsFull[tempStartMonth]} {tempStartYear} – {monthsFull[tempEndMonth]} {tempEndYear} */}
                                    {monthsFull[tempStartMonth]} {startPanelYear} – {monthsFull[tempEndMonth]} {endPanelYear}
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={handleApplyClick}
                                    className="w-full sm:w-auto flex justify-center px-9 py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-regular rounded-lg transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default MonthRangePicker;
