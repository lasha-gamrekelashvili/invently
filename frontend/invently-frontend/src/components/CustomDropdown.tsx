import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

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
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
}) => {
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
        required={required}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-4 py-3 pr-10 bg-white/90 backdrop-blur-sm border border-gray-200 
          rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 
          shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer
          text-left flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
          ${isOpen ? 'ring-4 ring-blue-300/50 border-blue-400' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id ? `${id}-label` : undefined}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto custom-dropdown-scroll">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              data-index={index}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => handleMouseEnter(index)}
              disabled={option.disabled}
              className={`
                w-full px-4 py-3 text-left transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl
                ${index === highlightedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'text-gray-900 hover:bg-gray-50'
                }
                ${option.disabled 
                  ? 'opacity-50 cursor-not-allowed text-gray-400' 
                  : 'cursor-pointer'
                }
                ${index === 0 ? 'rounded-t-xl' : ''}
                ${index === options.length - 1 ? 'rounded-b-xl' : ''}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
