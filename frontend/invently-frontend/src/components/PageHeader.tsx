import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionButton?: {
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actionButton,
  children
}) => {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-light text-neutral-900 flex items-center tracking-tight">
          {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-neutral-900 flex-shrink-0" />}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {children}
        {actionButton && (
          <Link 
            to={actionButton.href} 
            className="btn-primary flex items-center text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5"
          >
            {actionButton.icon ? (
              <actionButton.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            ) : (
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            )}
            <span className="hidden xs:inline sm:inline">{actionButton.label}</span>
            <span className="xs:hidden sm:hidden">{actionButton.label.split(' ').pop()}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
