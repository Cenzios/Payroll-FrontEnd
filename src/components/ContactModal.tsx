import React from 'react';
import { X, User, Mail, Phone, Hotel, Building, Building2 } from 'lucide-react';
import { Divider } from '@mui/material';
import whatsapp from '../assets/images/contact-whatsapp.svg';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className=" bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2563EB] to-[#0E1D44] px-8 py-10 text-center text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold mb-2 uppercase">Customize plan</h2>
                    <p className="text-sm font-extralight">Designed for your unique needs</p>
                </div>

                {/* Content */}
                <div className="px-10 py-10">
                    <div className="mb-10 text-center">
                        <p className="text-lg font-medium text-gray-900 leading-tight">
                            If you want a customize plan, <br />please contact us.
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        {/* Company */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Building2 className="w-5 h-5 text-[#0052CC]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Company </p>
                                <p className="text-base font-medium text-gray-800">Cenzios Pvt.Ltd</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Mail className="w-5 h-5 text-[#0052CC]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Email Address</p>
                                <p className="text-base font-medium text-gray-800">lahiru123@gmail.com</p>
                            </div>
                        </div>

                        {/* Contact No */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <Phone className="w-5 h-5 text-[#0052CC]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Contact No</p>
                                <p className="text-base font-medium text-gray-800">0764591786</p>
                            </div>
                        </div>

                        {/* Whatsapp No */}
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <img src={whatsapp} alt="whatsapp" className='w-5 h-5' />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Whatsapp No</p>
                                <p className="text-base font-medium text-gray-800">0764591786</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = 'mailto:lahiru123@gmail.com'}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563EB] to-[#0E1D44] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98]"
                    >
                        <Phone className="w-5 h-5 text-white" />

                        Call Now
                    </button>

                    <button
                        onClick={() => window.location.href = 'mailto:lahiru123@gmail.com'}
                        className="flex items-center justify-center gap-2 mt-4 w-full bg-blue-100 text-black font-bold py-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    >
                        <img src={whatsapp} alt="whatsapp" className='w-5 h-5' />
                        Connect WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
