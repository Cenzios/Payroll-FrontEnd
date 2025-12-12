import { useNavigate } from 'react-router-dom';
import PaymentFailImg from '../assets/images/PaymentFail-illustration.svg';

const ConfirmationFail = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/get-plan'); // ✅ Redirect back to packages
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="w-full max-w-lg relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="px-8 py-12 text-center">

                        {/* ❌ FAIL TITLE */}
                        <h1 className="text-3xl font-bold text-red-600 mb-8">
                            Payment Failed
                        </h1>

                        {/* ❌ FAIL IMAGE */}
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-gray-100 rounded-full blur-3xl opacity-50"></div>
                            <img
                                src={PaymentFailImg}
                                alt="Payment Failed"
                                className="w-64 h-64 mx-auto object-contain relative z-10"
                            />
                        </div>

                        {/* ❌ FAIL MESSAGE */}
                        <div className="mb-8 space-y-2">
                            <p className="text-gray-800 font-medium">
                                Your payment was unsuccessful.
                            </p>
                            <p className="text-gray-600">
                                Please try again or choose a different payment method.
                            </p>
                        </div>

                        {/* 🔙 BACK BUTTON */}
                        <button
                            onClick={handleBack}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Back to Packages
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationFail;
