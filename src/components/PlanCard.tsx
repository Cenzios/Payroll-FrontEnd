import { ArrowBigLeft, ArrowLeft, Check, Loader2, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    const navigate = useNavigate();
    return (
        <div className={` bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 ${showButton ? 'hover:shadow-3xl hover:-translate-y-1' : ''
            } ${isHighlighted ? 'ring-1 ring-blue-100' : ''} ${className} w-full max-w-md`}>

            {/* Header with Pricing */}
            <div className={`relative px-10 py-8 text-center text-white overflow-hidden bg-gradient-to-br from-[#2348AA] to-[#0E1D44]`}>

                <p className="text-xs tracking-widest opacity-80 flex items-start uppercase">{planName}</p>
                <div className="flex items-baseline gap-1 mt-3">
                    <p className="text-xl text-white font-semibold">RS:</p>
                    <span className="text-5xl text-white font-bold"> {price}</span>
                    <span className="text-sm text-white opacity-80 lowercase tracking-wider ml-1">/ employee / mo</span>
                </div>
                <p className="text-xs font-light flex items-start text-white mt-2">No employee limit - scales as your team grows</p>
                <p className="text-[10px] font-medium flex items-start text-white mt-3 bg-white/20 px-5 py-1 rounded-full w-fit border border-white/30">MOST POPULAR</p>
            </div>

            {/* Plan Details & Features */}
            <div className="px-10 ">


                <div className="border-t border-gray-100/60 mb-8 w-full"></div>

                {/* Features List */}
                <div className="space-y-4 mb-9">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 group">
                            <div className="w-4 h-4 rounded-full bg-[#255DAD] flex items-center justify-center shrink-0 shadow-lg shadow-blue-100 transition-transform group-hover:scale-110">
                                <Check className="w-3 h-3 text-white" strokeWidth={4} />
                            </div>
                            <span className="text-[#334155] text-[13px] font-medium leading-tight">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className='flex gap-4 text-sm'>
                    {/* Get the Plan Button */}
                    {showButton && (
                        <button
                            onClick={onSelectPlan}
                            disabled={isLoading}
                            className="w-full bg-[#0C3080] mb-5 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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

                    {/* Start Free Trial Button */}
                    {showButton && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-white mb-5 text-[#0C3080] border border-[#0C3080] font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                            Start free trial
                            <MoveRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PlanCard;
