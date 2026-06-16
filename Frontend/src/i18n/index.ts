import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import fr from './fr.json';
import en from './en.json';

const fallbackLng = 'fr';
const supported = ['fr', 'en'];

const deviceLang = getLocales()[0]?.languageCode;
const lng = supported.includes(deviceLang ?? '') ? deviceLang : fallbackLng;

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng,
  fallbackLng,
  interpolation: { escapeValue: false },
});

export default i18n;
