import { Check, Loader2, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_PREFIX, formatMoney, formatRs, isPositive } from '../utils/money';

interface PlanCardProps {
    planId?: string; // ✅ ADDED
    planName: string;
    price: string; // decimal string (API contract)
    description: string;
    features: string[];
    isHighlighted?: boolean;
    showButton?: boolean;
    isLoading?: boolean;
    onSelectPlan?: () => void;
    showFreeTrial?: boolean;
    className?: string;

    isMobileExpanded?: boolean;
    onMobileToggle?: () => void;
    /** Per-company employee limit from the plan data (plan.maxEmployees). Hidden when unknown. */
    maxEmployees?: number | null;
    /** Free-trial plan's per-company employee limit, shown under the trial button. */
    trialMaxEmployees?: number | null;
    /** One-time registration fee (decimal string), shown under the price when positive. */
    registrationFee?: string;
    showPerEmployeePrice?: boolean;
}

/** "up to N employees per company" (the limit is enforced per company). */
const employeeLimitText = (max: number): string =>
    `Up to ${max} employee${max === 1 ? '' : 's'} per company`;

const PlanCard: React.FC<PlanCardProps> = ({
    planId, // ✅ ADDED
    planName,
    price,
    features,
    isHighlighted = false,
    showButton = true,
    isLoading = false,
    onSelectPlan,
    showFreeTrial = true,
    className = '',
    isMobileExpanded = false,
    onMobileToggle,
    maxEmployees = null,
    trialMaxEmployees = null,
    registrationFee,
}) => {
    const hasLimit = typeof maxEmployees === 'number' && maxEmployees > 0;
    const allFeatures = hasLimit
        ? [`Payroll processing for ${employeeLimitText(maxEmployees).toLowerCase()}`, ...features]
        : features;

    const navigate = useNavigate();

    return (
        <div className={`
            bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300
            ${showButton ? 'hover:shadow-3xl hover:-translate-y-1' : ''}
            ${isHighlighted ? 'ring-1 ring-blue-100' : ''}
            ${className}
            w-full max-w-md 
            max-sm:rounded-2xl max-sm:shadow-md max-sm:max-w-full
        `}>

            {/* Header with Pricing */}
            {/* <div className={`relative px-10 py-8 text-center text-white overflow-hidden bg-gradient-to-br from-[#2348AA] to-[#0E1D44]`}> */}
            <div
                className="
    relative px-10 py-8 text-center text-white overflow-hidden
    max-sm:p-7 max-sm:cursor-pointer
    max-sm:flex max-sm:items-start max-sm:justify-between max-sm:text-left max-sm:h-[220px]"
                style={{
                    background: `linear-gradient(
                        305deg,
                        #1E3C72 23%,
                        #1E3C72 28%,
                        #1E3C72 32%,
                        #1E3C72 40%,
                        #1E3C72 40%,
                        #1E3C72 42%,
                        #203F77 48%,
                        #234581 61%,
                        #1E3C72 62%,
                        #2A5298 72%
                    )`
                }}
                onClick={onMobileToggle}
            >

                <div className="max-sm:flex-1">

                    {/* Plan name label */}
                    <p className="text-xs tracking-widest opacity-80 flex items-start uppercase">
                        {planName} Plan
                    </p>

                    {hasLimit && (
                        <p className="
                            text-xs font-light flex items-start text-white mt-[18px]
                            max-sm:mt-3\4 max-sm:text-sm max-sm:opacity-80
                        ">
                            {employeeLimitText(maxEmployees)}
                        </p>
                    )}

                    <p className="
                        text-[10px] font-medium flex items-start text-white mt-3
                        bg-white/20 px-5 py-1 rounded-full w-fit border border-white/30
                        max-sm:mt-4 max-sm:px-3 max-sm:py-0.5 
                    ">
                        MOST POPULAR
                    </p>

                    <div className="
                        flex items-baseline gap-1 mt-1
                        max-sm:mt-2
                    ">
                        <p className="text-xl text-white font-semibold max-sm:text-base">{CURRENCY_PREFIX}</p>
                        <span className="text-5xl text-white font-bold max-sm:text-4xl">{formatMoney(price)}</span>
                        <span className="text-[13px] text-white opacity-80 lowercase font-light ml-1 max-sm:text-[11px]">
                            / employee / month
                        </span>
                    </div>
                    {registrationFee !== undefined && isPositive(registrationFee) && (
                        <p className="text-[11px] text-white opacity-80 mt-1">
                            + {formatRs(registrationFee)} one-time registration fee
                        </p>
                    )}
                </div>

                {/* drop down icon */}
                <div className="hidden max-sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0 ml-auto mt-1 transition-transform duration-300"


                    style={{
                        transform: isMobileExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

            </div>

            {/* Plan Details & Features */}
            <div className={`
                    px-10 flex flex-col justify-start max-sm:px-4 max-sm:overflow-hidden max-sm:transition-all max-sm:duration-300 max-sm:ease-in-out
                ${isMobileExpanded
                    ? 'max-sm:max-h-[700px] max-sm:opacity-100 max-sm:pt-4 max-sm:pb-2'
                    : 'max-sm:max-h-0 max-sm:opacity-0 max-sm:pt-0 max-sm:pb-0'
                }
            `}>

                <div className="border-t border-gray-100/60 mb-8 w-full max-sm:mb-4" />

                {/* Features List */}
                <div className="flex flex-col gap-4 max-sm:gap-3 mb-6 max-sm:mb-5">
                    {allFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 group">
                            <div className="
                                w-4 h-4 rounded-full bg-[#255DAD]
                                flex items-center justify-center shrink-0
                                shadow-lg shadow-blue-100
                                transition-transform group-hover:scale-110
                            ">
                                <Check className="w-3 h-3 text-white" strokeWidth={4} />
                            </div>
                            <span className="text-[#334155] text-[13px] font-medium leading-tight">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Buttons row */}
                <div className="flex gap-4 text-sm mb-2 max-sm:flex-col max-sm:gap-2 max-sm:mb-4">

                    {/* Get the Plan button */}
                    {showButton && (
                        <button
                            onClick={onSelectPlan}
                            disabled={isLoading}
                            className="
                                w-full bg-[#0C3080] mb-5 text-white font-bold py-3 rounded-xl
                                shadow-lg shadow-blue-200 transition-all duration-200
                                active:scale-[0.98] mt-2
                                flex items-center justify-center
                                disabled:opacity-70 disabled:cursor-not-allowed
                                max-sm:mb-0 max-sm:mt-0 max-sm:rounded-xl max-sm:py-3
                            "
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                'Get the Plan'
                            )}
                        </button>
                    )}

                    {/* Start Free Trial Button */}
                    {showButton && showFreeTrial && (
                        <button
                            onClick={() => navigate(`/terms-and-conditions?isTrial=true&planId=${planId}`)}
                            className="
                                w-full bg-white mb-5 text-[#0C3080] border border-[#0C3080]
                                font-bold py-3 rounded-xl shadow-lg shadow-blue-200
                                transition-all duration-200 active:scale-[0.98] mt-2
                                flex items-center justify-center
                                disabled:opacity-70 disabled:cursor-not-allowed
                                max-sm:mb-0 max-sm:mt-0 max-sm:rounded-xl max-sm:py-3
                            "
                        >
                            Start Free Trial
                            <MoveRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                </div>

                {showButton && showFreeTrial && typeof trialMaxEmployees === 'number' && trialMaxEmployees > 0 && (
                    <p className="text-[11px] text-gray-500 mb-4 -mt-2">
                        Free trial: {employeeLimitText(trialMaxEmployees).toLowerCase()}
                    </p>
                )}

            </div>
        </div>
    );
};

export default PlanCard;
