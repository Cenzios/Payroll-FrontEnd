import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 text-gray-700">
                    <div className="space-y-6">
                        {/* System Info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">System Information</p>
                            <p className="text-sm text-gray-900"><strong>System Name:</strong> Payroll</p>
                            <p className="text-sm text-gray-900"><strong>Company:</strong> Cenzios (Pvt) Ltd</p>
                            <p className="text-sm text-gray-900"><strong>Operating Regions:</strong> Sri Lanka & Global</p>
                        </div>

                        {/* 1. Introduction */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h3>
                            <p className="text-sm leading-relaxed">
                                These Terms & Conditions govern the use of the Payroll system operated by Cenzios (Pvt) Ltd.
                                By registering for, accessing, or using the system, you agree to comply with and be legally bound by these Terms.
                            </p>
                        </section>

                        {/* 2. Nature of the Service */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">2. Nature of the Service</h3>
                            <p className="text-sm leading-relaxed">
                                Payroll is a Business-to-Business (B2B) payroll management system designed exclusively for company owners
                                and authorized company representatives. The system enables businesses to manage employee payroll-related processes digitally.
                            </p>
                        </section>

                        {/* 3. Account Registration */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">3. Account Registration</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                                <li>Users must provide accurate, complete, and current information during registration.</li>
                                <li>A one-time registration fee is payable in the first month.</li>
                                <li>From the second month onwards, subscription fees are calculated based on:
                                    <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                        <li>Number of employees</li>
                                        <li>Selected per-employee package cost</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        {/* 4. Subscription & Payment */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">4. Subscription & Payment</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                                <li>Subscription type: Monthly</li>
                                <li>Subscription auto-renews unless cancelled by the user.</li>
                                <li>No free trial is offered.</li>
                                <li>Failure to make payment may result in account termination after a defined grace period.</li>
                            </ul>
                        </section>

                        {/* 5. Cancellation Policy */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">5. Cancellation Policy</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                                <li>Users may cancel their subscription at any time via the system settings.</li>
                                <li>Cancellation will take effect at the end of the current billing cycle.</li>
                                <li>No refunds are guaranteed after cancellation unless approved on a case-by-case basis.</li>
                            </ul>
                        </section>

                        {/* 6. Refund Policy */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">6. Refund Policy</h3>
                            <p className="text-sm leading-relaxed">
                                Refund requests are evaluated individually and may be approved or rejected at the sole discretion of
                                Cenzios (Pvt) Ltd, depending on circumstances such as system errors or billing issues.
                            </p>
                        </section>

                        {/* 7. Data Storage & User Responsibility */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">7. Data Storage & User Responsibility</h3>
                            <p className="text-sm leading-relaxed mb-2">The system stores sensitive data including:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed mb-3">
                                <li>Employee salary information</li>
                                <li>Bank and payment-related details</li>
                            </ul>
                            <p className="text-sm leading-relaxed mb-2">Users are solely responsible for:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed mb-3">
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
                            <p className="text-sm leading-relaxed">
                                Reasonable technical and organizational measures are implemented to protect user data. However,
                                users acknowledge that no digital system is completely secure.
                            </p>
                        </section>

                        {/* 9. Account Suspension & Termination */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">9. Account Suspension & Termination</h3>
                            <p className="text-sm leading-relaxed mb-2">Cenzios (Pvt) Ltd reserves the right to suspend or terminate accounts:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                                <li>Due to non-payment</li>
                                <li>In case of misuse or violation of these Terms</li>
                                <li>If required by law or regulatory authorities</li>
                            </ul>
                        </section>

                        {/* 10. Limitation of Liability */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">10. Limitation of Liability</h3>
                            <p className="text-sm leading-relaxed mb-2">Cenzios (Pvt) Ltd shall not be liable for:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                                <li>Indirect or consequential losses</li>
                                <li>Payroll errors caused by incorrect user inputs</li>
                                <li>Service interruptions beyond reasonable control</li>
                            </ul>
                        </section>

                        {/* 11. Governing Law */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">11. Governing Law</h3>
                            <p className="text-sm leading-relaxed">
                                These Terms & Conditions shall be governed by and interpreted in accordance with the laws of Sri Lanka.
                            </p>
                        </section>

                        {/* 12. Contact Information */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">12. Contact Information</h3>
                            <p className="text-sm leading-relaxed mb-2">For support or legal inquiries:</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                                <p className="text-sm">📧 <strong>Email:</strong> info@cenzios.com</p>
                                <p className="text-sm">📞 <strong>Phone:</strong> +94 71 118 6028</p>
                            </div>
                        </section>

                        {/* Last Updated */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Last updated: December 2025</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
