import { ArrowLeft, Clock, Loader2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContactModal from "./ContactModal";
import { useState } from "react";

const PlanVerify = () => {
    const navigate = useNavigate();
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);


    return (

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-8 text-center">

            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#FEF3C6] flex items-center justify-center relative">
                    <Clock className="w-8 h-8 text-[#BB4D00]" />
                    <div className="absolute inset-0 rounded-full border-2 border-[#e7dba8]" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800">
                Verification Pending
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                We've successfully received your bank slip.
                Our admin team is currently reviewing your payment details.
            </p>

            {/* Details Card */}
            <div className="mt-6 bg-[#F7FAFF] rounded-2xl p-5 text-left">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                    Submission Details
                </h3>

                <div className="space-y-3 text-sm">

                    <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-[#FEF3C6] text-[#BB4D00] font-medium">
                            <Loader2Icon className="w-4 h-4" />
                            In Review
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Amount Submitted</span>
                        <span className="font-semibold text-base">Rs 100</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Reference ID</span>
                        <span className="font-normal">TRX-8923-AB</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Est. Approval Time</span>
                        <span className="font-semibold">1–2 Business Hours</span>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">

                {/* <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button> */}

                <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex-1 bg-blue-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-600">
                    Contact Support
                </button>
            </div>
            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
        </div>
    );
};

export default PlanVerify;