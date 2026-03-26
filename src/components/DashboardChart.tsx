import { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { ChevronDown } from 'lucide-react';

interface ChartData {
    name: string;
    total: number;
}

interface DashboardChartProps {
    data: ChartData[];
    onRangeChange: (range: string) => void;
    currentRange: string;
    isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">{payload[0].payload.name}</p>
                <p className="text-sm text-blue-600 font-bold">
                    RS: {payload[0].value?.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

const DashboardChart = ({ data, onRangeChange, currentRange, isLoading }: DashboardChartProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const ranges = [
        { label: 'Monthly', value: 'monthly' },
        { label: '3 monthly', value: '3months' },
        { label: '6 monthly', value: '6months' },
        { label: 'Yearly', value: 'yearly' }
    ];

    const currentRangeLabel = ranges.find(r => r.value === currentRange)?.label || 'Yearly';

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Salary Paid Summary</h3>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                    >
                        {currentRangeLabel}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                {ranges.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => {
                                            onRangeChange(range.value);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors ${currentRange === range.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => `${value > 999 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardChart;
