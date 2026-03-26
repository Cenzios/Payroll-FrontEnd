import React from 'react';
import { Check } from 'lucide-react';

interface PlanCardProps {
    planName: string;
    price: number;
    registrationFee: number;
    description: string;
    features: string[];
    showPerEmployeePrice?: boolean;
    isHighlighted?: boolean;
    showButton?: boolean;
    onSelectPlan?: () => void;
    className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
    planName,
    price,
    registrationFee,
    description,
    features,
    showPerEmployeePrice = false,
    isHighlighted = false,
    showButton = true,
    onSelectPlan,
    className = ''
}) => {
    return (
        <div className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-transform ${showButton ? 'hover:scale-105' : ''
            } ${isHighlighted ? 'ring-4 ring-blue-500' : ''} ${className}`}>
            {/* Registration Fee Header */}
            <div className={`relative px-6 py-6 text-center text-white overflow-hidden ${isHighlighted
                ? 'bg-gradient-to-b from-[#4683fc] to-[#327be2]'
                : 'bg-gradient-to-b from-gray-400 to-gray-500'
                }`}>
                <div className={`absolute inset-0 ${isHighlighted ? 'bg-blue-400/30' : 'bg-gray-300/30'
                    } blur-2xl opacity-60`}></div>

                <div className="relative z-10">
                    <p className="text-sm font-medium mb-1">One-time Registration Fee</p>
                    <p className="text-3xl font-bold">RS. {registrationFee.toLocaleString()}</p>
                    <p className="text-sm mt-1 opacity-90">
                        Charged in the first month only
                    </p>
                </div>
            </div>

            {/* Plan Details */}
            <div className="px-6 py-8">
                <div className="mb-5">
                    <p
                        className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isHighlighted ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        {planName} PLAN
                    </p>

                    {/* Per Employee Price (Informational – NOT charged now) */}
                    {showPerEmployeePrice && (
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-bold text-gray-900">
                                RS: {price}
                            </h2>
                            <span className="text-gray-600 text-sm">per employee</span>
                        </div>
                    )}

                    {/* Optional helper text for registration flow */}
                    {!showButton && showPerEmployeePrice && (
                        <p className="text-xs text-gray-500 mt-1">
                            Billed from the second month onwards
                        </p>
                    )}
                </div>

                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    {description}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-7">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isHighlighted ? 'bg-blue-600' : 'bg-gray-400'
                                    }`}
                            >
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Get the Plan Button (conditional) */}
                {showButton && (
                    <button
                        onClick={onSelectPlan}
                        className={`relative w-full font-semibold py-3.5 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] ${isHighlighted
                                ? 'bg-gradient-to-r from-[#4683fc] to-[#327be2] text-white'
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                    >
                        <span
                            className={`absolute inset-0 ${isHighlighted ? 'bg-blue-400/40' : 'bg-gray-300/40'
                                } blur-2xl opacity-70`}
                        ></span>
                        <span className="relative z-10">Get the plan</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlanCard;
