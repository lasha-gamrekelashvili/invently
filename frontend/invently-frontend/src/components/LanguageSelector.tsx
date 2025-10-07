import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from './Translation';
import { 
  GlobeAltIcon, 
  ChevronDownIcon, 
  CheckIcon,
  LanguageIcon 
} from '@heroicons/react/24/outline';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'buttons' | 'toggle' | 'compact' | 'micro';
  size?: 'sm' | 'md' | 'lg';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  variant = 'dropdown',
  size = 'md'
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      flag: '🇺🇸',
      icon: '🌐'
    },
    { 
      code: 'ka', 
      name: 'Georgian', 
      nativeName: 'ქართული',
      flag: '🇬🇪',
      icon: '🌐'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: 'en' | 'ka') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: {
      button: 'px-2 py-1.5 text-xs',
      icon: 'w-3 h-3',
      flag: 'text-sm',
      dropdown: 'py-1',
      item: 'px-2 py-1.5 text-xs'
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      flag: 'text-base',
      dropdown: 'py-1',
      item: 'px-3 py-2 text-sm'
    },
    lg: {
      button: 'px-4 py-3 text-base',
      icon: 'w-5 h-5',
      flag: 'text-lg',
      dropdown: 'py-2',
      item: 'px-4 py-3 text-base'
    }
  };

  const currentSize = sizeClasses[size];

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            <T tKey="language.select" />
          </span>
        )}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as 'en' | 'ka')}
              className={`${currentSize.button} rounded-md transition-all duration-200 flex items-center space-x-1.5 ${
                language === lang.code
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className={currentSize.flag}>{lang.flag}</span>
              <span className="font-medium">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            <T tKey="language.select" />
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${currentSize.button} bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-2 ${
              isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'
            }`}
          >
            <GlobeAltIcon className={currentSize.icon} />
            <span className={currentSize.flag}>{currentLanguage?.flag}</span>
            <span className="font-medium">{currentLanguage?.nativeName}</span>
            <ChevronDownIcon className={`${currentSize.icon} transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isOpen && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as 'en' | 'ka')}
                  className={`w-full ${currentSize.item} flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={currentSize.flag}>{lang.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{lang.nativeName}</div>
                      <div className="text-xs text-gray-500">{lang.name}</div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <CheckIcon className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'micro') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-3 hover:border-gray-300 text-base"
        >
          <GlobeAltIcon className="w-5 h-5 text-gray-600" />
          <span className="font-semibold">{currentLanguage?.code.toUpperCase()}</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 mt-2 right-0 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'ka')}
                className={`w-full px-4 py-3 text-base font-medium hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.code.toUpperCase()}</span>
                {language === lang.code && (
                  <CheckIcon className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${currentSize.button} bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-2 ${
            isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'
          }`}
        >
          <span className={currentSize.flag}>{currentLanguage?.flag}</span>
          <ChevronDownIcon className={`${currentSize.icon} transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 mt-2 right-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'ka')}
                className={`w-full ${currentSize.item} flex items-center space-x-2 hover:bg-gray-50 transition-colors ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className={currentSize.flag}>{lang.flag}</span>
                <span className="font-medium">{lang.nativeName}</span>
                {language === lang.code && (
                  <CheckIcon className="w-4 h-4 text-blue-600 ml-auto" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <T tKey="language.select" />
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full ${currentSize.button} text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 ${
            isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className={currentSize.icon} />
              <span className={currentSize.flag}>{currentLanguage?.flag}</span>
              <div>
                <div className="font-medium">{currentLanguage?.nativeName}</div>
                <div className="text-xs text-gray-500">{currentLanguage?.name}</div>
              </div>
            </div>
            <ChevronDownIcon className={`${currentSize.icon} transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'ka')}
                className={`w-full ${currentSize.item} text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={currentSize.flag}>{lang.flag}</span>
                  <div>
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                </div>
                {language === lang.code && (
                  <CheckIcon className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
