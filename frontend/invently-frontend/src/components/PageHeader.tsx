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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          {Icon && <Icon className="h-8 w-8 mr-3 text-blue-600" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center space-x-3">
        {children}
        {actionButton && (
          <Link to={actionButton.href} className="btn-primary flex items-center">
            {actionButton.icon ? (
              <actionButton.icon className="h-5 w-5 mr-2" />
            ) : (
              <PlusIcon className="h-5 w-5 mr-2" />
            )}
            {actionButton.label}
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageHeader;