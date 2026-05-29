import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../hooks/useSettings'
import { hashPin } from '../utils/pinHash'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { BigInput } from '../components/UI/BigInput'
import { COMPANY } from '../constants/company'

export function Settings() {
  const { t, i18n } = useTranslation('ui')
  const { settings, updateSetting } = useSettings()
  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  const handleLangChange = (lang) => {
    updateSetting('uiLanguage', lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('omniworx_ui_language', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const handleSavePin = async () => {
    if (newPin.length !== 4) { setPinError('PIN moet 4 cijfers zijn'); return }
    if (newPin !== confirmPin) { setPinError(t('pin_error_match')); return }
    const hash = await hashPin(newPin)
    updateSetting('pinHash', hash)
    setChangingPin(false)
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setPinSuccess(true)
    setTimeout(() => setPinSuccess(false), 3000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('settings_title')} />

      <div className="p-4 pb-24 flex flex-col gap-6">

        {/* UI Language */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-gold-500">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('label_ui_language')}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleLangChange('nl')}
              className={`flex-1 min-h-[64px] text-xl font-bold rounded-2xl border-2 transition-all font-poppins ${settings.uiLanguage === 'nl' ? 'bg-primary-700 text-gold-400 border-primary-700' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              🇳🇱 Nederlands
            </button>
            <button
              onClick={() => handleLangChange('ar')}
              className={`flex-1 min-h-[64px] text-xl font-bold rounded-2xl border-2 transition-all font-poppins ${settings.uiLanguage === 'ar' ? 'bg-primary-700 text-gold-400 border-primary-700' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              🇸🇦 عربي
            </button>
          </div>
        </section>

        {/* Payment terms */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('label_default_due_days')}</h2>
          <BigInput
            type="number"
            inputMode="numeric"
            value={settings.defaultDueDays || 14}
            onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n) && n > 0) updateSetting('defaultDueDays', n) }}
            min="1"
            max="365"
          />
        </section>

        {/* Quote validity */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('label_default_valid_days')}</h2>
          <BigInput
            type="number"
            inputMode="numeric"
            value={settings.defaultValidDays || 30}
            onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n) && n > 0) updateSetting('defaultValidDays', n) }}
            min="1"
            max="365"
          />
        </section>

        {/* PIN */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('label_change_pin')}</h2>
          {pinSuccess && <p className="text-green-600 text-lg mb-3">✅ PIN gewijzigd!</p>}
          {!changingPin ? (
            <BigButton variant="outline" onClick={() => setChangingPin(true)}>
              🔐 {t('label_change_pin')}
            </BigButton>
          ) : (
            <div className="flex flex-col gap-3">
              <BigInput
                label="Nieuwe PIN (4 cijfers)"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                placeholder="• • • •"
              />
              <BigInput
                label="Bevestig PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                placeholder="• • • •"
              />
              {pinError && <p className="text-red-600 text-base">{pinError}</p>}
              <BigButton onClick={handleSavePin}>{t('btn_save')}</BigButton>
              <BigButton variant="secondary" onClick={() => { setChangingPin(false); setNewPin(''); setConfirmPin(''); setPinError('') }}>{t('btn_cancel')}</BigButton>
            </div>
          )}
        </section>

        {/* Company info */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('settings_company')}</h2>
          <div className="flex flex-col gap-2 text-lg text-gray-600">
            <p className="font-bold text-gray-800">{COMPANY.name}</p>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.postalCity}</p>
            <p>KVK: {COMPANY.kvk}</p>
            <p>BTW-ID: {COMPANY.btwId}</p>
            <p>IBAN: {COMPANY.iban}</p>
          </div>
        </section>

        {/* App info */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('settings_app_info')}</h2>
          <p className="text-lg text-gray-500">{t('settings_version')}</p>
        </section>

      </div>
    </div>
  )
}
