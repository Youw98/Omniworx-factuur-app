import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import nl from './locales/nl.json'
import ar from './locales/ar.json'
import en from './locales/en.json'

const savedLanguage = localStorage.getItem('omniworx_ui_language') || 'nl'

i18n.use(initReactI18next).init({
  resources: {
    nl: { ui: nl.ui, invoice: nl.invoice },
    ar: { ui: ar.ui, invoice: ar.invoice },
    en: { invoice: en.invoice },
  },
  lng: savedLanguage,
  fallbackLng: 'nl',
  ns: ['ui', 'invoice'],
  defaultNS: 'ui',
  interpolation: { escapeValue: false },
})

export default i18n
