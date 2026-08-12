
const CardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between animate-pulse">
        <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
);

const QuickActionSkeleton = () => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-32 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-40 bg-gray-200 rounded"></div>
    </div>
);

const EmployeeUsageSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse h-full">
        <div className="flex justify-between items-center mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex flex-col items-center mb-6">
            <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full mb-6"></div>
        <div className="flex justify-between mb-6">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* LEFT – Quick Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <QuickActionSkeleton key={i} />
                        ))}
                    </div>
                </div>

                {/* RIGHT – Employee Usage */}
                <div className="lg:col-span-1">
                    <EmployeeUsageSkeleton />
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
