import { useState, useEffect } from "react";
import { UploadCloud, Copy, Loader2, X, AlertCircle } from "lucide-react";
import PlanVerify from "./PlanVerify";
import axiosInstance from "../api/axios";

const PlanPaymentManual = () => {
    const [file, setFile] = useState<File | null>(null);
    const [reference, setReference] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const accountNumber = "1234567890";

    // ✅ Check for existing docs on mount
    useEffect(() => {
        const fetchExistingDocs = async () => {
            try {
                const { data } = await axiosInstance.get("/user-documents");
                const documents = data.data || [];
                const latestDoc = documents[0];

                if (latestDoc?.status === "PENDING") {
                    setReference(latestDoc.referenceId || "");
                    setIsSubmitted(true);
                } else if (latestDoc?.status === "REJECTED") {
                    setRejectionReason("Your previous payment proof was rejected by the admin. Please upload a clear bank slip for verification.");
                }
            } catch (err) {
                console.warn("Failed to fetch existing user documents", err);
            }
        };
        fetchExistingDocs();
    }, []);

    const validateFile = (file: File) => {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only PNG, JPG, and PDF are allowed.");
            return false;
        }

        if (file.size > maxSize) {
            alert("File is too large. Maximum size is 10MB.");
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            if (file) {
                const confirmReplace = window.confirm("You have already selected a file. Do you want to replace it with the new one?");
                if (!confirmReplace) {
                    e.target.value = ""; // Clear the input
                    return;
                }
            }

            if (validateFile(selectedFile)) {
                setFile(selectedFile);
            } else {
                e.target.value = ""; // Clear the input
            }
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber);
    };

    const handleSubmit = async () => {
        if (!file) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (reference) {
                formData.append("referenceId", reference);
            }

            await axiosInstance.post("/user-documents", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to upload manual payment doc", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return <PlanVerify referenceId={reference || "N/A"} />;
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 space-y-4 max-sm:w-[22rem]">

            <h3 className="text-lg font-bold text-gray-900 max-sm:flex max-sm:justify-center">
                Bank Deposit & Slip Upload
            </h3>

            {rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                        {rejectionReason}
                    </p>
                </div>
            )}

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">BANK NAME</span>
                    <span className="font-semibold text-gray-800 text-sm">
                        Commercial Bank PLC
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">ACCOUNT NAME</span>
                    <span className="font-semibold text-gray-800 text-sm">
                        L.D.S.Pathum Udayanga
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">ACCOUNT NUMBER</span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                            {accountNumber}
                        </span>
                        <button onClick={handleCopy}>
                            <Copy className="w-4 h-4 text-blue-500" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">BRANCH</span>
                    <span className="font-semibold text-gray-800 text-sm">
                        Colombo City Branch
                    </span>
                </div>
            </div>

            {/* Upload Box */}
            <label
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const droppedFile = e.dataTransfer.files?.[0];

                    if (droppedFile) {
                        if (file) {
                            const confirmReplace = window.confirm("You have already selected a file. Do you want to replace it with the new one?");
                            if (!confirmReplace) return;
                        }

                        if (validateFile(droppedFile)) {
                            setFile(droppedFile);
                        }
                    }
                }}
            >
                <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />

                <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-700">
                        {file ? file.name : "Choose a file or Drag & Drop"}
                    </p>
                    {file && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFile(null);
                            }}
                            className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1 hover:text-red-600"
                        >
                            <X className="w-3 h-3" /> Remove File
                        </button>
                    )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                    Accepted: PNG, JPG, PDF (Max 10MB)
                </p>

                <input
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileChange}
                />
            </label>

            {/* Reference Input */}
            <div>
                <p className="text-xs text-gray-400 mb-1">
                    ADD DEPOSIT REFERENCE ID (OPTIONAL)
                </p>
                <input
                    type="text"
                    placeholder="e.g. TXN-987654321"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || !file}
                className="w-full bg-[#367AFF] text-white font-semibold py-3 flex justify-center items-center rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed max-sm:rounded-lg max-sm:py-4 max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:shadow-blue-200"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Bank Slip & Activate"}
            </button>

            {/* Footer Note */}
            <p className="text-[11px] text-gray-400 text-center">
                Verification typically takes 1–2 business hours. A confirmation email will be sent.
            </p>
        </div>
    );
};

export default PlanPaymentManual;