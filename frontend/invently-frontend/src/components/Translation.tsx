import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TranslationProps {
  tKey: string;
  params?: Record<string, any>;
  fallback?: string;
  className?: string;
  children?: (translatedText: string) => React.ReactNode;
}

export const T: React.FC<TranslationProps> = ({ 
  tKey, 
  params, 
  fallback, 
  className,
  children 
}) => {
  const { t } = useLanguage();
  
  const translatedText = t(tKey, params);
  const displayText = translatedText === tKey ? (fallback || tKey) : translatedText;

  if (children) {
    return <>{children(displayText)}</>;
  }

  return <span className={className}>{displayText}</span>;
};

// Hook for programmatic translation
export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
};
