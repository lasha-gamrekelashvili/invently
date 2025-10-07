import React from 'react';
import {
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'product';
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'order',
  showIcon = false,
  size = 'md'
}) => {
  const { t } = useLanguage();
  const getStatusIcon = (status: string) => {
    const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    switch (status) {
      case 'PENDING':
        return <ClockIcon className={`${iconClass} text-yellow-600`} />;
      case 'CONFIRMED':
        return <CheckCircleIcon className={`${iconClass} text-blue-600`} />;
      case 'SHIPPED':
        return <TruckIcon className={`${iconClass} text-purple-600`} />;
      case 'DELIVERED':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'CANCELLED':
        return <XCircleIcon className={`${iconClass} text-red-600`} />;
      case 'ACTIVE':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'DRAFT':
        return <ClockIcon className={`${iconClass} text-yellow-600`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    if (type === 'product') {
      switch (status) {
        case 'ACTIVE':
          return t('products.status.active');
        case 'DRAFT':
          return t('products.status.draft');
        case 'DELETED':
          return t('products.status.deleted');
        default:
          return status;
      }
    } else {
      // For orders, use order status translations
      switch (status) {
        case 'PENDING':
          return t('orders.status.pending');
        case 'CONFIRMED':
          return t('orders.status.confirmed');
        case 'SHIPPED':
          return t('orders.status.shipped');
        case 'DELIVERED':
          return t('orders.status.delivered');
        case 'CANCELLED':
          return t('orders.status.cancelled');
        default:
          return status;
      }
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <div className="flex items-center">
      {showIcon && getStatusIcon(status)}
      <span
        className={`${showIcon ? 'ml-2' : ''} inline-flex items-center ${sizeClasses} font-medium rounded-full ${
          type === 'order' ? 'border' : ''
        } ${getStatusColor(status)}`}
      >
        {getStatusText(status)}
      </span>
    </div>
  );
};

export default StatusBadge;