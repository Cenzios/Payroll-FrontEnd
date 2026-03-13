import React from 'react';
import HeaderActions from './HeaderActions';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showLogout?: boolean;
  actionElement?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, showLogout = false, actionElement }: PageHeaderProps) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-[#141B3B] leading-tight">
          {title}
        </h1>
        <p className="text-[16px] font-medium text-gray-500 mt-1">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {actionElement}
        <HeaderActions showLogout={showLogout} />
      </div>
    </header>
  );
};

export default PageHeader;
