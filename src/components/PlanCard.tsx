import { Check, Loader2 } from 'lucide-react';

interface PlanCardProps {
    planName: string;
    price: number;
    description: string;
    features: string[];
    isHighlighted?: boolean;
    showButton?: boolean;
    isLoading?: boolean;
    onSelectPlan?: () => void;
    className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
    planName,
    price,
    description,
    features,
    isHighlighted = false,
    showButton = true,
    isLoading = false,
    onSelectPlan,
    className = ''
}) => {
    return (
        <div className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 ${showButton ? 'hover:shadow-3xl hover:-translate-y-1' : ''
            } ${isHighlighted ? 'ring-1 ring-blue-100' : ''} ${className} w-full max-w-sm`}>

            {/* Header with Pricing */}
            <div className={`relative px-8 py-10 text-center text-white overflow-hidden bg-gradient-to-br from-[#4683fc] via-[#327be2] to-[#2563eb]`}>
                <div className="absolute inset-0 bg-blue-400/20 blur-3xl opacity-60"></div>

                <div className="relative z-10 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1 opacity-90 text-white">{planName} PLAN</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-4xl font-black text-gray-900">RS:{price}</span>
                        <span className="text-[10px] font-medium text-gray-800 opacity-80 uppercase tracking-wider ml-1">per employee</span>
                    </div>
                </div>
            </div>

            {/* Plan Details & Features */}
            <div className="px-10 py-8">


                <div className="border-t border-gray-100/60 mb-8 w-full"></div>

                {/* Features List */}
                <div className="space-y-6 mb-10">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 group">
                            <div className="w-6 h-6 rounded-full bg-[#4683fc] flex items-center justify-center shrink-0 shadow-lg shadow-blue-100 transition-transform group-hover:scale-110">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                            </div>
                            <span className="text-gray-500 text-[13px] font-medium leading-tight">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Get the Plan Button */}
                {showButton && (
                    <button
                        onClick={onSelectPlan}
                        disabled={isLoading}
                        className="w-full bg-[#4683fc] hover:bg-[#327be2] text-white font-bold py-4 rounded-[2rem] shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            'Get the plan'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlanCard;
