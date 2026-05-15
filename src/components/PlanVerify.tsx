import { ArrowLeft, Clock, Loader2Icon, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContactModal from "./ContactModal";
import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const PlanVerify = ({ referenceId }: { referenceId?: string }) => {
    const navigate = useNavigate();
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [status, setStatus] = useState<"PENDING" | "APPROVED">("PENDING");

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const subRes = await axiosInstance.get('/subscription/current');
                if (subRes.data?.data?.status === 'ACTIVE') {
                    setStatus("APPROVED");
                }
            } catch (error) {
                console.warn("Failed to check approval status", error);
            }
        };

        checkStatus();
        const intervalId = setInterval(checkStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);


    return (

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-8 text-center
        max-sm:w-[22rem]">

            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${status === 'APPROVED' ? 'bg-[#D1FAE5]' : 'bg-[#FEF3C6]'}`}>
                    {status === 'APPROVED' ? (
                        <CheckCircle className="w-8 h-8 text-[#059669]" />
                    ) : (
                        <Clock className="w-8 h-8 text-[#BB4D00]" />
                    )}
                    <div className={`absolute inset-0 rounded-full border-2 max-sm:hidden ${status === 'APPROVED' ? 'border-[#A7F3D0]' : 'border-[#e7dba8]'}`} />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800">
                {status === 'APPROVED' ? "Payment Approved" : "Verification Pending"}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                {status === 'APPROVED' ? (
                    "Your payment has been successfully approved! You can now access your dashboard and manage your subscriptions."
                ) : (
                    "We've successfully received your bank slip. Our admin team is currently reviewing your payment details."
                )}
            </p>

            {/* Details Card */}
            <div className="mt-6 bg-[#F7FAFF] rounded-2xl p-5 text-left">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                    Submission Details
                </h3>

                <div className="space-y-3 text-sm">

                    <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        {status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#D1FAE5] text-[#059669] font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Approved
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#FEF3C6] text-[#BB4D00] font-medium">
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                In Review
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Amount Submitted</span>
                        <span className="font-semibold text-base text-end">Rs 100</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Reference ID</span>
                        <span className="font-normal text-end">{referenceId || "TRX-8923-AB"}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Est. Approval Time</span>
                        <span className="font-semibold text-end">1–2 Business Hours</span>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
                {status === 'APPROVED' ? (
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="flex-1 bg-[#059669] text-white rounded-xl py-3 text-sm font-bold hover:bg-[#047857] shadow-lg shadow-green-200"
                    >
                        Login to Dashboard
                    </button>
                ) : (
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="flex-1 bg-blue-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-600
                 max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200">
                        Contact Support
                    </button>
                )}
            </div>

            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title="Payment Support"
                subtitle="We're here to help you"
                description="If your payment verification is taking longer than expected, please contact our support team."
            />
        </div>
    );
};

export default PlanVerify;