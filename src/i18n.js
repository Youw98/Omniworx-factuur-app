import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import nl from './locales/nl.json'
import ar from './locales/ar.json'
import en from './locales/en.json'

const savedLanguage = (() => {
  try {
    return JSON.parse(localStorage.getItem('omniworx_settings') || '{}')?.uiLanguage || 'nl'
  } catch {
    return 'nl'
  }
})()

i18n.use(initReactI18next).init({
  resources: {
    nl: { ui: nl.ui, invoice: nl.invoice, quote: nl.quote },
    ar: { ui: ar.ui, invoice: ar.invoice, quote: ar.quote },
    en: { invoice: en.invoice, quote: en.quote },
  },
  lng: savedLanguage,
  fallbackLng: 'nl',
  ns: ['ui', 'invoice', 'quote'],
  defaultNS: 'ui',
  interpolation: { escapeValue: false },
})

export default i18n
