import enTranslations from '../locales/en.json';
import kaTranslations from '../locales/ka.json';

export type Language = 'en' | 'ka';

const translations = {
  en: enTranslations,
  ka: kaTranslations,
};

export const getTranslations = (language: Language) => {
  return translations[language] || translations.en;
};

export const t = (key: string, language: Language, params?: Record<string, any>): string => {
  const translationData = getTranslations(language);
  let translation: any = key.split('.').reduce((obj: any, k: string) => obj?.[k], translationData);
  
  if (typeof translation !== 'string') {
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key; // Return the key if translation is missing
  }

  // Replace parameters in translation
  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }

  return translation;
};
