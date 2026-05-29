import { useLocalStorage } from './useLocalStorage'

const DEFAULT_SETTINGS = {
  uiLanguage: 'nl',
  defaultDueDays: 14,
  defaultValidDays: 30,
  defaultBtwRate: 21,
  defaultInvoiceLanguage: 'nl',
  pinHash: null,
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage('omniworx_settings', DEFAULT_SETTINGS)

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return { settings, updateSetting }
}
