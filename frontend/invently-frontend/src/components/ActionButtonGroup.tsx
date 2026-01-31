import React from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

interface ActionButton {
  type: 'edit' | 'delete' | 'save' | 'cancel' | 'custom';
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  className?: string;
  disabled?: boolean;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  onStopPropagation?: boolean;
  className?: string;
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  onStopPropagation = true,
  className = ''
}) => {
  const { t } = useLanguage();
  const getDefaultIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return PencilIcon;
      case 'delete':
        return TrashIcon;
      case 'save':
        return CheckIcon;
      case 'cancel':
        return XMarkIcon;
      default:
        return PencilIcon;
    }
  };

  const getDefaultClassName = (type: string) => {
    switch (type) {
      case 'edit':
        return 'text-neutral-400 hover:text-neutral-900';
      case 'delete':
        return 'text-neutral-400 hover:text-neutral-900';
      case 'save':
        return 'text-neutral-900 hover:text-neutral-700';
      case 'cancel':
        return 'text-neutral-400 hover:text-neutral-600';
      default:
        return 'text-neutral-400 hover:text-neutral-900';
    }
  };

  const getDefaultTitle = (type: string) => {
    switch (type) {
      case 'edit':
        return t('common.edit');
      case 'delete':
        return t('common.delete');
      case 'save':
        return t('common.saveChanges');
      case 'cancel':
        return t('common.cancel');
      default:
        return '';
    }
  };

  return (
    <div
      className={`flex items-center justify-end space-x-2 ${className}`}
      onClick={onStopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {actions.map((action, index) => {
        const Icon = action.icon || getDefaultIcon(action.type);
        const buttonClassName = action.className || getDefaultClassName(action.type);
        const title = action.title || getDefaultTitle(action.type);

        return (
          <button
            key={index}
            onClick={(e) => {
              if (onStopPropagation) e.stopPropagation();
              action.onClick();
            }}
            className={`p-1 rounded transition-colors ${buttonClassName} ${
              action.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={title}
            disabled={action.disabled}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ActionButtonGroup;