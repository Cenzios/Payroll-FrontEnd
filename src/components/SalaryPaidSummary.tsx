import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import { salaryApi } from '../api/salaryApi';

interface SalaryPaidSummaryProps {
    companyId: string;
}

const SalaryPaidSummary = ({ companyId }: SalaryPaidSummaryProps) => {
    const [timeRange, setTimeRange] = useState('Monthly');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const ranges = ['Monthly', '3 monthly', '6 monthly', 'yearly'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const { data, isLoading } = useQuery({
        queryKey: ['salaryPaidSummary', companyId, timeRange],
        queryFn: async () => {
            const end = new Date();
            const start = new Date();

            if (timeRange === 'Monthly') start.setMonth(end.getMonth() - 11); // Last 12 months
            else if (timeRange === '3 monthly') start.setMonth(end.getMonth() - 3);
            else if (timeRange === '6 monthly') start.setMonth(end.getMonth() - 6);
            else if (timeRange === 'yearly') start.setFullYear(end.getFullYear() - 1);

            const response = await salaryApi.getSalaryReport(
                companyId,
                start.getMonth() + 1,
                start.getFullYear(),
                end.getMonth() + 1,
                end.getFullYear()
            );

            return (response.data.monthlyData || []).map((m: any) => ({
                name: m.month.substring(0, 3),
                value: m.totals?.totalNetPay || 0,
                fullValue: m.totals?.totalNetPay || 0
            }));
        },
        enabled: !!companyId,
    });

    const chartData = data || [];

    const formatYAxis = (tick: any) => {
        if (tick >= 1000) return `${tick / 1000}k`;
        return tick;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg">
                    RS: {payload[0].value.toLocaleString()}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-8 h-full border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[15px] font-semibold text-gray-900">Salary Paid Summary</h2>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-normal text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        {timeRange} View
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                            {ranges.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors first:pt-3 last:pb-3"
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalaryPaidSummary;
