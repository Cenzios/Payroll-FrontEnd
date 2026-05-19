import { ArrowLeft, Clock, Loader2Icon, CheckCircle, AlertCircle, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContactModal from "./ContactModal";
import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useGetUserDocumentsQuery } from "../store/apiSlice";

const PlanVerify = ({ referenceId }: { referenceId?: string }) => {
    const navigate = useNavigate();
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

    // Fetch user documents to check for rejection
    const { data: documentsData, refetch: refetchDocs } = useGetUserDocumentsQuery();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // 1. Check Subscription Status
                const subRes = await axiosInstance.get('/subscription/current');
                const subStatus = subRes.data?.data?.status;

                if (subStatus === 'ACTIVE') {
                    // But check if there's a recent rejection that takes precedence for the UI
                    const latestDoc = documentsData?.data?.[0];
                    if (latestDoc && latestDoc.status === 'REJECTED') {
                        setStatus("REJECTED");
                    } else {
                        setStatus("APPROVED");
                    }
                    return;
                }

                // 2. Check Document Status if subscription is not active
                const latestDoc = documentsData?.data?.[0];
                if (latestDoc) {
                    if (latestDoc.status === 'APPROVED') {
                        setStatus("APPROVED");
                    } else if (latestDoc.status === 'REJECTED') {
                        setStatus("REJECTED");
                    } else {
                        setStatus("PENDING");
                    }
                }
            } catch (error) {
                console.warn("Failed to check approval status", error);
            }
        };

        checkStatus();
        const intervalId = setInterval(() => {
            checkStatus();
            refetchDocs();
        }, 5000);
        return () => clearInterval(intervalId);
    }, [documentsData, refetchDocs]);


    return (

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-8 text-center max-sm:w-[22rem]">

            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center relative 
                    ${status === 'APPROVED' ? 'bg-[#D1FAE5]' :
                        status === 'REJECTED' ? 'bg-red-100' : 'bg-[#FEF3C6]'}`}>
                    {status === 'APPROVED' ? (
                        <CheckCircle className="w-8 h-8 text-[#059669]" />
                    ) : status === 'REJECTED' ? (
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    ) : (
                        <Clock className="w-8 h-8 text-[#BB4D00]" />
                    )}
                    <div className={`absolute inset-0 rounded-full border-2 max-sm:hidden 
                        ${status === 'APPROVED' ? 'border-[#A7F3D0]' :
                            status === 'REJECTED' ? 'border-red-200' : 'border-[#e7dba8]'}`} />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800">
                {status === 'APPROVED' ? "Payment Approved" :
                    status === 'REJECTED' ? "Payment Rejected" : "Verification Pending"}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                {status === 'APPROVED' ? (
                    "Your payment has been successfully approved! You can now access your dashboard and manage your subscriptions."
                ) : status === 'REJECTED' ? (
                    "Your payment proof was rejected by the admin. Please review your submission and upload a valid bank slip."
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
                        ) : status === 'REJECTED' ? (
                            <span className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700 font-medium">
                                <AlertCircle className="w-4 h-4" />
                                Rejected
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
                ) : status === 'REJECTED' ? (
                    <button
                        onClick={() => {
                            // Reset state and allow re-upload
                            navigate('/buy-plan?isUpgrade=true');
                        }}
                        className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Resubmit Payment
                    </button>
                ) : (
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="flex-1 bg-blue-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-600 max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200">
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