import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';

const fallbackLng = 'fr';

// Français par défaut (app pensée FR-first pour le Cameroun) ; l'utilisateur
// peut basculer en anglais depuis l'écran Profil.
const lng = 'fr';

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
