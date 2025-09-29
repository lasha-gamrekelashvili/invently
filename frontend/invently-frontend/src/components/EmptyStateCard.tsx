import React from 'react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon: Icon,
  actionButton,
  className = ''
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        {Icon && (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-gray-500" />
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 mb-6">
          {description}
        </p>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
              actionButton.variant === 'secondary'
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyStateCard;