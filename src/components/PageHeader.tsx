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
    // Wraps instead of overflowing at narrower desktop widths (e.g. 1024px), so Log Out stays visible
    <header className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between mb-6 shrink-0 gap-4">
      <div className="shrink-0">
        <h1 className="text-[28px] font-semibold text-gray-900 leading-tight">
          {title}
        </h1>
        <p className="text-[15px] font-normal text-gray-500 mt-1">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto min-w-0">
        {actionElement}
        <HeaderActions showLogout={showLogout} />
      </div>
    </header>
  );
};

export default PageHeader;
