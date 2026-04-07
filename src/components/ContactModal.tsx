import React from 'react';
import { X, User, Mail, Phone } from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#3A7BDE] px-8 py-10 text-center text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <p className="text-sm font-medium opacity-90 mb-2">Tailored Solutions</p>
                    <h2 className="text-4xl font-bold mb-2">Customize</h2>
                    <p className="text-sm opacity-90 italic">Designed for your unique needs</p>
                </div>

                {/* Content */}
                <div className="px-10 py-10">
                    <div className="mb-10 text-center">
                        <p className="text-[#3A7BDE] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Customize Plan</p>
                        <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                            If you want a customize plan, please contact us.
                        </h3>
                    </div>

                    <div className="space-y-6 mb-10">
                        {/* Contact Person */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <User className="w-5 h-5 text-[#3A7BDE]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Person</p>
                                <p className="text-base font-semibold text-gray-800">Lahiru Sandeepa</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Mail className="w-5 h-5 text-[#3A7BDE]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                                <p className="text-base font-semibold text-gray-800">lahiru123@gmail.com</p>
                            </div>
                        </div>

                        {/* Contact No */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Phone className="w-5 h-5 text-[#3A7BDE]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact No</p>
                                <p className="text-base font-semibold text-gray-800">0764591786</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = 'mailto:lahiru123@gmail.com'}
                        className="w-full bg-[#4E8DFF] hover:bg-[#3B7BDE] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98]"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
