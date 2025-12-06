import { ReactNode } from 'react';
import logo from '../assets/images/logo.svg';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  illustration?: string;
}

const AuthLayout = ({ children, title, subtitle, illustration }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-60 h-60 border-[30px] border-white/15 rounded-full translate-x-32 -translate-y-32"></div>

        <div className="absolute top-55 -left-20 w-64 h-64 border-[30px] border-white/15 rounded-full"></div>
        <div className="absolute bottom-[-60px] -left-10 w-80 h-80 border-[30px] border-white/10 rounded-full"></div>

        <div className="absolute bottom-[-20px] -left-28 w-40 h-40 bg-white/15 rounded-full translate-x-80 transition-all duration-300 ease-in-out"></div>
        <div className="absolute bottom-[60px] -left-60 w-28 h-28 rounded-full translate-x-80 transition-all duration-300 ease-in-out bg-gradient-to-br from-white/50 via-white/20 to-transparent blur-[0.5px]"></div>

        <div className="absolute bottom-10 right-16 grid grid-cols-10 gap-3 opacity-20">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-16">
            <img
              src={logo}
              alt="Cenzios Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-4xl font-semibold tracking-tight">Cenzios</h1>
          </div>

          <h2 className="text-4xl font-semibold mb-4 leading-tight">
            Automated. Accurate. On Time.
          </h2>
          <p className="text-2xl text-white/100 font-light">
            Welcome to Cenzios Payroll.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {(illustration || title || subtitle) && (
              <div className="mb-8 text-center">
                {illustration && (
                  <div className="mb-4">
                    <img
                      src={illustration}
                      alt="Illustration"
                      className="w-32 h-32 mx-auto object-contain"
                    />
                  </div>
                )}
                {title && (
                  <h2 className="text-3xl font-bold text-gray-900">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-gray-600 mt-2">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
