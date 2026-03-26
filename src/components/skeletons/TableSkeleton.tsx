
const TableRowSkeleton = () => (
    <div className="flex items-center space-x-4 py-4 border-b border-gray-100 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
);

const TableSkeleton = ({ rows = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

export default TableSkeleton;
