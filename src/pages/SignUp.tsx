import React, { useState } from 'react';

const SignUp: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Sign up with:', { fullName, email });
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="relative lg:w-1/2 bg-blue-600 text-white p-12 flex items-center justify-center overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full opacity-15 blur-3xl"></div>
                <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-700 rounded-full opacity-10 blur-2xl"></div>

                <div className="relative z-10 text-center max-w-md">
                    <h1 className="text-5xl font-bold mb-6">Payrole</h1>
                    <p className="text-xl mb-8 font-light tracking-wide">Automated. Accurate. On Time.</p>
                    <p className="text-2xl font-semibold">Welcome to Payrole.</p>
                </div>
            </div>

            <div className="lg:w-1/2 bg-white p-8 lg:p-12 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <svg
                            className="w-32 h-32"
                            viewBox="0 0 200 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect x="40" y="60" width="80" height="100" rx="8" fill="#E5E7EB" />
                            <circle cx="80" cy="40" r="25" fill="#D1D5DB" />
                            <rect x="130" y="80" width="40" height="60" rx="4" fill="#9CA3AF" />
                            <rect x="50" y="100" width="20" height="3" rx="1.5" fill="#6B7280" />
                            <rect x="50" y="110" width="30" height="3" rx="1.5" fill="#6B7280" />
                            <rect x="50" y="120" width="25" height="3" rx="1.5" fill="#6B7280" />
                        </svg>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                            Let's setup your account
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="Nimal Kumara"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="nimalkumara@mail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Next
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
