import { useState } from "react";
import { UploadCloud, Copy } from "lucide-react";
import PlanVerify from "./PlanVerify";

const PlanPaymentManual = () => {
    const [file, setFile] = useState<File | null>(null);
    const [reference, setReference] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const accountNumber = "1234567890";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber);
    };

    const handleSubmit = () => {
        console.log("File:", file);
        console.log("Reference:", reference);

        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return <PlanVerify />;
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 space-y-4">

            <h3 className="text-lg font-bold text-gray-900">
                Bank Deposit & Slip Upload
            </h3>

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
            <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition">
                <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />

                <p className="text-sm text-gray-700">
                    {file ? file.name : "Choose a file or Drag & Drop"}
                </p>

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
                className="w-full bg-[#367AFF] text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 transition"
            >
                Submit Bank Slip & Activate
            </button>

            {/* Footer Note */}
            <p className="text-[11px] text-gray-400 text-center">
                Verification typically takes 1–2 business days. A confirmation email will be sent.
            </p>
        </div>
    );
};

export default PlanPaymentManual;