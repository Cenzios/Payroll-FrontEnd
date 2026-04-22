import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface SingleMonthPickerProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number, year: number) => void;
    onApply?: (month: number, year: number) => void;
    className?: string;
}

const SingleMonthPicker: React.FC<SingleMonthPickerProps> = ({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onApply,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempMonth, setTempMonth] = useState(selectedMonth);
    const [panelYear, setPanelYear] = useState(selectedYear);
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
                const selectedDateValue = panelYear * 12 + tempMonth;
                const currentDateValue = currentYear * 12 + currentMonth;

                // Check if date is valid (not in the future)
                if (selectedDateValue <= currentDateValue) {
                    onMonthChange(tempMonth, panelYear);
                }
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, tempMonth, panelYear, onMonthChange, currentMonth, currentYear]);

    const formatDate = () => {
        const monthName = String(selectedMonth + 1).padStart(2, '0');
        return `${monthName}/${selectedYear}`;
    };

    const handleOpen = () => {
        setTempMonth(selectedMonth);
        setPanelYear(selectedYear);
        setIsOpen(true);
    };

    const handleMonthClick = (monthIndex: number) => {
        setTempMonth(monthIndex);
    };

    const handleApplyClick = () => {
        const selectedDateValue = panelYear * 12 + tempMonth;
        const currentDateValue = currentYear * 12 + currentMonth;

        if (selectedDateValue > currentDateValue) {
            alert("Cannot select future months");
            return;
        }

        onMonthChange(tempMonth, panelYear);

        if (onApply) {
            onApply(tempMonth, panelYear);
        }
        setIsOpen(false);
    };

    const isMonthSelected = (monthIndex: number, year: number) => {
        return monthIndex === tempMonth && year === panelYear;
    };

    const isMonthDisabled = (monthIndex: number, year: number) => {
        const monthDateValue = year * 12 + monthIndex;
        const currentDateValue = currentYear * 12 + currentMonth;
        return monthDateValue > currentDateValue;
    };

    return (
        <div className={`relative ${className}`} ref={popupRef}>
            {/* Trigger Button */}
            <div
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-gray-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{formatDate()}</span>
            </div>

            {/* Popup */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-6 w-[320px]">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setPanelYear(panelYear - 1)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="font-semibold text-gray-900">{panelYear}</span>
                            <button
                                onClick={() => setPanelYear(panelYear + 1)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-2 font-medium text-center uppercase tracking-wider">Select Month</div>
                        <div className="grid grid-cols-3 gap-2">
                            {months.map((month, index) => {
                                const selected = isMonthSelected(index, panelYear);
                                const disabled = isMonthDisabled(index, panelYear);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => !disabled && handleMonthClick(index)}
                                        disabled={disabled}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${disabled
                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            : selected
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {month}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Display */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-3">
                        <div className="text-center">
                            <div className="text-[10px] text-blue-600 font-bold tracking-wide mb-1">Selected Month</div>
                            <div className="text-sm text-blue-900 font-semibold">
                                {monthsFull[tempMonth]} {panelYear}
                            </div>
                        </div>
                        <button
                            onClick={handleApplyClick}
                            className="w-full py-2 bg-[#2b74ff] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleMonthPicker;
