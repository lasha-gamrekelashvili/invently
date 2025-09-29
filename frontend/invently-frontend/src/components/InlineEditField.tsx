import React from 'react';
import CustomDropdown from './CustomDropdown';

interface DropdownOption {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  type: 'text' | 'number' | 'dropdown';
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  displayValue?: string;
  displayClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  options?: DropdownOption[];
  prefix?: string;
  step?: string;
  min?: string;
  onStopPropagation?: boolean;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  type,
  value,
  onChange,
  isEditing,
  displayValue,
  displayClassName = 'text-sm font-medium text-gray-900',
  inputClassName = 'text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-20',
  placeholder,
  options,
  prefix,
  step,
  min,
  onStopPropagation = true
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onStopPropagation) {
      e.stopPropagation();
    }
  };

  if (!isEditing) {
    return (
      <div className={displayClassName}>
        {prefix && <span className="text-gray-500 mr-1">{prefix}</span>}
        {displayValue || value}
      </div>
    );
  }

  switch (type) {
    case 'number':
      return (
        <div className="flex items-center" onClick={handleClick}>
          {prefix && <span className="text-sm text-gray-500 mr-1">{prefix}</span>}
          <input
            type="number"
            step={step}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClassName}
            placeholder={placeholder}
          />
        </div>
      );

    case 'dropdown':
      return (
        <div onClick={handleClick}>
          <CustomDropdown
            value={value}
            onChange={onChange}
            options={options || []}
            size="compact"
            className="w-20"
          />
        </div>
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          placeholder={placeholder}
          onClick={handleClick}
        />
      );
  }
};

export default InlineEditField;