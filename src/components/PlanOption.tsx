import { CreditCard, Landmark, MoveRight } from "lucide-react";
import PlanPaymentCard from "./PlanPaymentCard";
import PlanPaymentManual from "./PlanPaymentManual";
import { useState } from "react";

interface PaymentMethodSelectorProps {
    value: "card" | "manual";
    onChange: (method: "card" | "manual") => void;
}

const PlanOption: React.FC<PaymentMethodSelectorProps> = ({
    value,
    onChange,
}) => {
    const [step, setStep] = useState<"select" | "pay">("select");

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
            subtitle: "Bank deposit",
            icon: Landmark,
        },
    ];

    return (
        <>
            {step === "select" && (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 space-y-4">

                    <h3 className="text-lg font-bold text-gray-900">
                        Payment Method
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
                            <p className="text-sm text-gray-500">Subtotal</p>
                            <span className="font-semibold">Rs: 100.00</span>
                        </div>

                        <div className="flex justify-between">
                            <p className="text-sm text-gray-500">Tax (0%)</p>
                            <span className="font-semibold">Rs: 0.00</span>
                        </div>

                        <div className="flex justify-between mt-4">
                            <h3 className="font-bold">Total</h3>
                            <h3 className="font-bold text-blue-500">Rs: 100.00</h3>
                        </div>

                        <button
                            onClick={() => setStep("pay")}
                            className="w-full bg-[#3B82F6] font-semibold text-white mt-4 py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                            Proceed to Pay
                            <MoveRight className="inline-block" />
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 REPLACED VIEW */}
            {step === "pay" && (
                <>
                    {value === "card" && <PlanPaymentCard />}
                    {value === "manual" && <PlanPaymentManual />}
                </>
            )}
        </>
    );
};

export default PlanOption;