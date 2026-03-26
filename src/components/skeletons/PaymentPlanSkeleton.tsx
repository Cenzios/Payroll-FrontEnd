
const PaymentPlanSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-pulse">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 w-32 bg-gray-300 rounded"></div>
                    </div>
                ))}
            </div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>
    );
};

export default PaymentPlanSkeleton;
