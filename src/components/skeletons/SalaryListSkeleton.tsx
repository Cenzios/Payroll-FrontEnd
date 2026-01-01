
const SalaryCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const SalaryListSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <SalaryCardSkeleton key={i} />
            ))}
        </div>
    );
};

export default SalaryListSkeleton;
