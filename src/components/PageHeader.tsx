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
        <h1 className="text-[28px] font-semibold text-gray-900 leading-tight">
          {title}
        </h1>
        <p className="text-[15px] font-normal text-gray-500 mt-1">
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
