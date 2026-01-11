import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'compact';
}

const CustomDropdown: React.FC<CustomDropdownProps> = React.memo(({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  size = 'default',
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const optionElement = dropdownRef.current?.querySelector(`[data-index="${highlightedIndex}"]`);
      optionElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleMouseEnter = (index: number) => {
    setHighlightedIndex(index);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full bg-white border border-gray-300 
          rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          hover:border-gray-400 appearance-none cursor-pointer
          text-left flex items-center justify-between transition-all
          ${size === 'compact' ? 'px-2 py-1 pr-5 text-xs' : 'px-3 py-2 sm:py-2.5 md:px-4 md:py-3 pr-8 md:pr-10 text-xs sm:text-sm'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-400'} truncate text-xs sm:text-sm`}>
          {selectedOption ? selectedOption.label : (placeholder || t('common.selectOption'))}
        </span>
        <ChevronDownIcon 
          className={`text-gray-400 transition-transform flex-shrink-0 ${
            size === 'compact' ? 'w-3 h-3' : 'w-4 h-4'
          } ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              data-index={index}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => handleMouseEnter(index)}
              disabled={option.disabled}
              className={`
                block w-full text-left whitespace-nowrap overflow-hidden transition-colors
                ${size === 'compact' ? 'px-2 py-1 text-xs' : 'px-3 py-2 md:px-4 md:py-2.5 text-xs sm:text-sm'}
                ${index === highlightedIndex 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
                ${option.disabled 
                  ? 'opacity-50 cursor-not-allowed text-gray-400' 
                  : 'cursor-pointer'
                }
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                ${index > 0 && index < options.length - 1 ? 'rounded-none' : ''}
              `}
            >
              {option.label}
            </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CustomDropdown.displayName = 'CustomDropdown';

export default CustomDropdown;
