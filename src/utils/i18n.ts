import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en/translation.json';
import frTranslation from '../locales/fr/translation.json';

const resources = {
    en: { translation: enTranslation },
    fr: { translation: frTranslation },
};

// Retrieve the saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage, // Use the saved language
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});

export default i18n;
