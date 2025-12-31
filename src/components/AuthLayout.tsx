import { ReactNode } from 'react';
import logo from '../assets/images/logo.svg';
import illustrationAsset from '../assets/images/Ilustration-Asset.svg';
import mainImage from '../assets/images/Image.svg';
import kit2 from '../assets/images/Kit 2.svg';
import bgIllustration from '../assets/images/Background-illustration.svg';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  illustration?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Grey Background with Illustrations */}

      <div className="hidden lg:flex lg:w-1/2 bg-[#F8F9FA] relative items-center justify-center p-12 overflow-hidden">
        {/* Logo */}
        <div className="absolute top-12 left-12">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Payroll Logo" className="h-8 md:h-10" />

          </div>
        </div>

        {/* Center Composition */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          {/* We position these absolutely relative to this container to create the layered effect */}
          {/* Bottom layer - Kit 2 */}
          <div
            className="absolute bottom-[-120px] right-[-60px]
  -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <img
              src={kit2}
              alt="Dashboard UI"
              className="w-[30] h-auto object-contain
    animate-[float_4s_ease-in-out_infinite]"
            />
          </div>

          {/* Middle layer - Illustration Asset */}
          <div
            className="absolute top-[190px] left-1/2
  -translate-x-1/2 -translate-y-1/2
  w-full h-full z-0"
          >
            <img
              src={illustrationAsset}
              alt="Background Elements"
              className="w-full h-full object-contain
    animate-[float-slow_10s_ease-in-out_infinite]"
            />
          </div>

          {/* Top layer - Main Image */}
          <div
            className="absolute top-30 left-[80px]
  -translate-x-1/2 -translate-y-1/2 z-60"
          >
            <img
              src={mainImage}
              alt="User Profile"
              className="w-[80] h-auto object-contain
    animate-[float_3.5s_ease-in-out_infinite]"
            />
          </div>
        </div>
        {/* Background Waves - Bottom Left (Stable on all screens) */}
        <div className="absolute bottom-[-290px] -left-40 w-[520px] h-[520px] 
  z-0 pointer-events-none">
          <img
            src={bgIllustration}
            alt="Background Wave"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Right Side - White Background with Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 bg-white relative overflow-hidden">

        {/* Background Waves - Top Right */}
        <div className="absolute -top-60 -right-28 w-96 h-96 z-0 opacity-100 pointer-events-none">
          <img src={bgIllustration} alt="Background Wave" className="w-full h-full object-contain rotate-180" />
        </div>



        <div className="w-full max-w-md mx-auto relative z-10 animate-[fadeInUp_0.6s_ease-out]">
          <div className="mb-8">
            {/* Mobile Logo (visible only on small screens) */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <img src={logo} alt="Payroll Logo" className="h-8" />
              <span className="text-[#3A8BFF] text-2xl font-bold">ayroll</span>
            </div>

            {title && (
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="text-gray-500 mt-3 text-base">
                {subtitle}
              </p>
            )}
          </div>

          <div className="animate-[fadeIn_0.6s_ease-out_0.2s_both]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
