import { CreditCard, Landmark, MoveRight, Wallet } from "lucide-react";
import PlanPaymentCard from "./PlanPaymentCard";
import PlanPaymentManual from "./PlanPaymentManual";
import { useState } from "react";
import PlanPaymentPayhere from "./PlanPaymentPayhere";

interface PaymentMethodSelectorProps {
    value: "card" | "manual" | "payhere" | null;
    onChange: (method: "card" | "manual" | "payhere") => void;
    step?: "select" | "pay";
    onStepChange?: (step: "select" | "pay") => void;
    initialStep?: "select" | "pay";
    pricePerEmployee: number;
    employeeCount: number;
    onEmployeeCountChange: (count: number) => void;
}

const PlanOption: React.FC<PaymentMethodSelectorProps> = ({
    value,
    onChange,
    step: controlledStep,
    onStepChange,
    initialStep = "select",
    pricePerEmployee,
    employeeCount,
    onEmployeeCountChange,
}) => {
    const [internalStep, setInternalStep] = useState<"select" | "pay">(initialStep);

    const step = controlledStep !== undefined ? controlledStep : internalStep;

    const handleSetStep = (newStep: "select" | "pay") => {
        if (onStepChange) onStepChange(newStep);
        setInternalStep(newStep);
    };

    const options = [
        {
            type: "card" as const,
            title: "Card Payment",
            subtitle: "Visa, Mastercard, Amex",
            icon: CreditCard,
        },
        {
            type: "manual" as const,
            title: "Manual Payment",
            subtitle: "Bank Deposit",
            icon: Landmark,
        },
        {
            type: "payhere" as const,
            title: "PayHere",
            subtitle: "Local Online Payment",
            icon: Wallet,
        },
    ];

    return (
        <>
            {step === "select" && (
                <>
                    <div className="bg-white rounded-3xl shadow-md p-5 mb-2">
                        <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-gray-800 uppercase tracking-wide">
                                    Number of Employees
                                </p>
                                <p className="text-xs text-gray-400">Scale your plan as your team grows</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <p className="text-lg font-bold w-12 text-center bg-[#F8FAFC]">
                                    {employeeCount}
                                </p>

                                {/* <button
                                    onClick={() => onEmployeeCountChange(Math.max(1, employeeCount - 1))}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                >
                                    −
                                </button>

                                <input
                                    type="number"
                                    min={1}
                                    value={employeeCount}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1) onEmployeeCountChange(val);
                                    }}
                                    className="text-lg font-bold w-12 text-center bg-[#F8FAFC] 
                                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />

                                <button
                                    onClick={() => onEmployeeCountChange(employeeCount + 1)}
                                    className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                                >
                                    +
                                </button> */}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl p-8 space-y-3
                                max-sm:w-[22rem]">

                        <h3 className="text-lg font-bold text-gray-900
                    max-sm:flex max-sm:justify-center">
                            Payment Methods
                        </h3>

                        <p className="text-sm text-gray-500">
                            Choose how you would like to pay for your subscription.
                        </p>

                        {/* OPTIONS */}
                        {options.map((option) => {
                            const Icon = option.icon;
                            const selected = value === option.type;

                            return (
                                <div
                                    key={option.type}
                                    onClick={() => onChange(option.type)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200
                                ${selected
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-gray-200 bg-white hover:shadow-sm"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 flex items-center justify-center rounded-full
                                        ${selected
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <div>
                                            <p className={`text-sm font-semibold ${selected ? "text-blue-600" : "text-gray-800"}`}>
                                                {option.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {option.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                ${selected ? "border-blue-500" : "border-gray-300"}`}>
                                        {selected && (
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* TOTAL + BUTTON */}
                        <div className="flex flex-col gap-2 mt-6">
                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500">Subscription Subtotal</p>
                                {/* <span className="font-semibold">Rs: 100.00</span> */}
                                <div className="text-right">
                                    <p className="font-semibold">Rs. {pricePerEmployee.toFixed(2)} X {employeeCount}</p>
                                    <span className="font-semibold">Rs. {(pricePerEmployee * employeeCount).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500">Applicable Tax (0%)</p>
                                <span className="font-semibold">Rs. 0.00</span>
                            </div>

                            <div className="flex justify-between mt-4">
                                <h3 className="font-bold">Total</h3>
                                {/* <h3 className="font-bold text-blue-500">Rs: 100.00</h3> */}
                                <h3 className="font-bold text-blue-500">Rs. {(pricePerEmployee * employeeCount).toFixed(2)}</h3>
                            </div>

                            <button
                                onClick={() => handleSetStep("pay")}
                                disabled={!value}
                                className={`w-full font-semibold text-white mt-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all
                                ${!value ? "bg-gray-300 cursor-not-allowed" : "bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98]"}`}
                            >
                                Proceed to Pay
                                <MoveRight className="inline-block" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 🔥 REPLACED VIEW */}
            {step === "pay" && (
                <>
                    {value === "card" && <PlanPaymentCard />}
                    {value === "manual" && <PlanPaymentManual />}
                    {value === "payhere" && <PlanPaymentPayhere />}
                </>
            )}
        </>
    );
};

export default PlanOption;