import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import bgIllustration from '../assets/images/Background-illustration.svg';
import axiosInstance from '../api/axios'; // ✅ ADDED


const TermsAndConditions = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isPlanChange = searchParams.get('isPlanChange') === 'true';
    const isTrial = searchParams.get('isTrial') === 'true';
    const planId = searchParams.get('planId'); // ✅ GET PLAN ID

    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // ✅ ADDED
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = () => {
        const el = contentRef.current;
        if (!el) return;

        const isBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 10;

        if (isBottom) {
            setHasScrolledToBottom(true);
        }
    };

    // const handleAccept = async () => {
    //     localStorage.setItem('termsAccepted', 'true');

    //     if (isTrial) {
    //         try {
    //             setIsProcessing(true);
    //             console.log('🚀 Starting formal trial for plan:', planId);
    //             await axiosInstance.post('/subscription/start-trial', { planId });
    //             navigate('/dashboard');
    //         } catch (error) {
    //             console.error('❌ Failed to start trial:', error);
    //             alert('Failed to start trial. Please try again.');
    //         } finally {
    //             setIsProcessing(false);
    //         }
    //     } else {
    //         navigate(`/buy-plan?isPlanChange=${isPlanChange}`);
    //     }
    // };

    const handleAccept = async () => {
        localStorage.setItem('termsAccepted', 'true');

        if (isTrial) {
            try {
                setIsProcessing(true);
                console.log('🚀 Starting formal trial for plan:', planId);
                await axiosInstance.post('/subscription/start-trial', { planId });
                navigate('/dashboard');
            } catch (error) {
                console.error('❌ Failed to start trial:', error);
                alert('Failed to start trial. Please try again.');
            } finally {
                setIsProcessing(false);
            }
        } else if (isPlanChange) {
            // Existing user changing plans — not first time — same as before
            navigate(`/buy-plan?isPlanChange=${isPlanChange}`);
        } else {
            // First-time signup with a paid plan selected
            setShowConfirmModal(true);
        }
    };

    const handleConfirmActivation = async () => {
        try {
            setIsProcessing(true);
            await axiosInstance.post('/subscription/activate-pending');
            navigate('/dashboard');
        } catch (error) {
            console.error('❌ Failed to activate subscription:', error);
            alert('Failed to activate your account. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        navigate(`/get-plan?isPlanChange=${isPlanChange}`);
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl w-full space-y-8 relative z-10">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Terms & Conditions</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[76vh]">
                    {/* Scrollable Content */}
                    <div
                        ref={contentRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-8 py-8 text-gray-700"
                    >
                        <div className="space-y-6">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Agreement</h2>

                                {/* System Info */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-900"><strong>System Name:</strong> CenzHRM</p>
                                    <p className="text-sm text-gray-900"><strong>Company:</strong> Cenzios (Pvt) Ltd</p>
                                    <p className="text-sm text-gray-900"><strong>Operating Regions:</strong> Sri Lanka & Global</p>
                                </div>

                                {/* 1. Introduction */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        These Terms & Conditions govern the use of the CenzHRM system operated by Cenzios (Pvt) Ltd.
                                        By registering for, accessing or using the system, you agree to comply with and be legally bound by these Terms.
                                    </p>
                                </section>
                            </div>

                            {/* 2. Nature of the Service */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">2. Nature of the Service</h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    CenzHRM is a Business-to-Business (B2B) payroll management system designed exclusively for company owners
                                    and authorized company representatives. The system enables businesses to manage employee payroll-related processes digitally.
                                </p>
                            </section>

                            {/* 3. Account Registration */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">3. Account Registration</h3>
                                <ul className="list-disc  space-y-2 text-sm leading-relaxed text-gray-600 ml-4">
                                    <li>Users must provide accurate, complete, and current information during registration.</li>
                                    <li>Upon commencement of the billing cycle, the Client agrees to pay a monthly subscription fee of LKR 100 for each active employee account. Clients seeking bespoke features or customized volume pricing may contact our sales department to establish an alternative agreement.</li>
                                </ul>
                            </section>

                            {/* 4. Subscription & Payment */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">4. Subscription & Payment</h3>
                                <ul className="list-disc space-y-2 text-sm leading-relaxed text-gray-600  ml-4">
                                    <li>Subscription type: Monthly</li>
                                    <li>Subscription auto-renews unless cancelled by the user.</li>
                                    <li>A one-time, three-month free trial period is available exclusively to new customers who have not previously held an active account with us.</li>
                                    <li>Failure to make payment may result in account termination after a defined grace period.</li>
                                </ul>
                            </section>

                            {/* 5. Cancellation Policy */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">5. Cancellation Policy</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-gray-600">
                                    <li>Users may cancel their subscription at any time via the system settings.</li>
                                    <li>Cancellation will take effect at the end of the current billing cycle.</li>
                                    <li>No refunds are guaranteed after cancellation unless approved on a case-by-case basis.</li>
                                </ul>
                            </section>

                            {/* 6. Refund Policy */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">6. Refund Policy</h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    Refund requests are evaluated individually and may be approved or rejected at the sole discretion of
                                    Cenzios (Pvt) Ltd, depending on circumstances such as system errors or billing issues.
                                </p>
                            </section>

                            {/* 7. Data Storage & User Responsibility */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">7. Data Storage & User Responsibility</h3>
                                <p className="text-sm leading-relaxed mb-2 text-gray-600">The system stores sensitive data including:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed mb-3 text-gray-600">
                                    <li>Employee salary information</li>
                                    <li>Bank and payment-related details</li>
                                </ul>
                                <p className="text-sm leading-relaxed mb-2 text-gray-600">Users are solely responsible for:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed mb-3 text-gray-600">
                                    <li>Accuracy of all entered data</li>
                                    <li>Maintaining confidentiality of login credentials</li>
                                    <li>Ensuring compliance with applicable employment and tax regulations</li>
                                </ul>
                                <p className="text-sm leading-relaxed font-semibold text-gray-900">
                                    Cenzios (Pvt) Ltd is not liable for losses resulting from incorrect data input by users.
                                </p>
                            </section>

                            {/* 8. Data Security & Confidentiality */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">8. Data Security & Confidentiality</h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    Reasonable technical and organizational measures are implemented to protect user data. However,
                                    users acknowledge that no digital system is completely secure.
                                </p>
                            </section>

                            {/* 9. Account Suspension & Termination */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">9. Account Suspension & Termination</h3>
                                <p className="text-sm leading-relaxed mb-2 text-gray-600">Cenzios (Pvt) Ltd reserves the right to suspend or terminate accounts:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed text-gray-600">
                                    <li>Due to non-payment</li>
                                    <li>In case of misuse or violation of these Terms</li>
                                    <li>If required by law or regulatory authorities</li>
                                </ul>
                            </section>

                            {/* 10. Limitation of Liability */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">10. Limitation of Liability</h3>
                                <p className="text-sm leading-relaxed mb-2 text-gray-600">Cenzios (Pvt) Ltd shall not be liable for:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed text-gray-600">
                                    <li>Indirect or consequential losses</li>
                                    <li>CenzHRM errors caused by incorrect user inputs</li>
                                    <li>Service interruptions beyond reasonable control</li>
                                </ul>
                            </section>

                            {/* 11. Governing Law */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">11. Governing Law</h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    These Terms & Conditions shall be governed by and interpreted in accordance with the laws of Sri Lanka.
                                </p>
                            </section>

                            {/* 12. Contact Information */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">12. Contact Information</h3>
                                <p className="text-sm leading-relaxed mb-2 text-gray-600">For support or legal inquiries:</p>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                                    <p className="text-sm text-gray-600">📧 <strong>Email:</strong> info@cenzios.com</p>
                                    <p className="text-sm text-gray-600">📞 <strong>Phone:</strong> +94 70 113 4650</p>
                                </div>
                            </section>

                            {/* Last Updated */}
                            <div className="text-center pt-8 border-t border-gray-200 mt-8">
                                <p className="text-xs text-gray-400">Last updated: December 2025</p>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-4">
                        {/* Row 1: Centered Message */}
                        {!hasScrolledToBottom && (
                            <div className="text-center w-full">
                                <p className="text-sm text-gray-500">
                                    Please scroll to the bottom to enable agreement
                                </p>
                            </div>
                        )}

                        {/* Row 2: Right-aligned Buttons */}
                        <div className="flex items-center justify-end gap-4 w-full">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors whitespace-nowrap"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={!hasScrolledToBottom || isProcessing}
                                className={`px-6 py-2 font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2
                                    ${hasScrolledToBottom && !isProcessing
                                        ? 'bg-[#3A8BFF] text-white hover:bg-[#337AEB] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 max-sm:rounded-lg max-sm:bg-gradient-to-r max-sm:from-[#2054C8] max-sm:to-[#5C5CB7] max-sm:shadow-lg max-sm:text-white max-sm:border-0 max-sm:shadow-blue-200'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    'Agree and Continue'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Background Wave - Bottom Left (Flipped) */}
            <div className="absolute bottom-[-350px] left-[-200px] w-[700px] h-[700px] z-0 pointer-events-none">
                <img
                    src={bgIllustration}
                    alt="Background Wave"
                    className="w-full h-full object-contain scale-x-[-1]"
                />
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.5 20.5h17a1.5 1.5 0 001.39-2.46L13.71 3.86a1.5 1.5 0 00-2.42 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">You're all set to go !</h2>
                        <p className="text-sm leading-relaxed text-gray-500 mb-8">
                            By clicking confirm, you can immediately add your employees and continue working.
                            You won't be charged today. Your first bill will be created 30 days from your registration date.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmActivation}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-2xl hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default TermsAndConditions;
