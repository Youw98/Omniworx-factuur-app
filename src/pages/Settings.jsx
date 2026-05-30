import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../hooks/useSettings'
import { useWorkspace } from '../hooks/useWorkspace'
import { hashPin } from '../utils/pinHash'
import { downloadLocalBackup, saveFirebaseBackup, getLastBackupDate, formatBackupDate } from '../utils/backup'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { BigInput } from '../components/UI/BigInput'
import { COMPANY } from '../constants/company'

export function Settings() {
  const { t, i18n } = useTranslation('ui')
  const { settings, updateSetting } = useSettings()
  const { workspaceId, createWorkspace, joinWorkspace, leaveWorkspace, copyCode, syncStatus } = useWorkspace()

  // Sync section state
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  const [backupStatus, setBackupStatus] = useState('')
  const [lastBackup, setLastBackup] = useState(() => getLastBackupDate())

  const handleLocalBackup = () => {
    try {
      downloadLocalBackup()
      setLastBackup(getLastBackupDate())
      setBackupStatus('local')
      setTimeout(() => setBackupStatus(''), 3000)
    } catch {
      setBackupStatus('error')
      setTimeout(() => setBackupStatus(''), 3000)
    }
  }

  const handleFirebaseBackup = async () => {
    setBackupStatus('saving')
    try {
      await saveFirebaseBackup(workspaceId)
      setLastBackup(getLastBackupDate())
      setBackupStatus('firebase')
      setTimeout(() => setBackupStatus(''), 3000)
    } catch {
      setBackupStatus('error')
      setTimeout(() => setBackupStatus(''), 3000)
    }
  }

  const handleCreateWorkspace = async () => {
    await createWorkspace()
  }

  const handleJoinWorkspace = async () => {
    setJoinError('')
    const result = await joinWorkspace(joinCode)
    if (result.ok) {
      setShowJoinInput(false)
      setJoinCode('')
    } else {
      setJoinError(result.error)
    }
  }

  const handleCopyCode = async () => {
    await copyCode()
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const formatJoinCode = (value) => {
    // Auto-format input: uppercase, insert dash after OWX if needed
    const raw = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    // Strip existing dashes and rebuild
    const stripped = raw.replace(/-/g, '')
    if (stripped.length <= 3) return stripped
    return stripped.slice(0, 3) + '-' + stripped.slice(3, 11)
  }

  const handleLangChange = (lang) => {
    updateSetting('uiLanguage', lang)
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const handleSavePin = async () => {
    if (newPin.length !== 4) { setPinError(t('pin_error_length')); return }
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

        {/* Sync & samenwerking */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-gold-500">
          <h2 className="text-xl font-bold text-primary-700 mb-2 font-poppins">☁️ Sync &amp; samenwerking</h2>

          {!workspaceId ? (
            <>
              <p className="text-base text-gray-600 mb-4">
                {t('sync_description')}
              </p>
              {!showJoinInput ? (
                <div className="flex flex-col gap-3">
                  <BigButton
                    onClick={handleCreateWorkspace}
                    disabled={syncStatus === 'loading'}
                  >
                    {syncStatus === 'loading' ? t('label_loading') : t('sync_create')}
                  </BigButton>
                  <BigButton
                    variant="outline"
                    onClick={() => { setShowJoinInput(true); setJoinError('') }}
                  >
                    {t('sync_join')}
                  </BigButton>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-base text-gray-700 font-medium">{t('sync_enter_code')}</p>
                  <BigInput
                    value={joinCode}
                    onChange={e => {
                      setJoinCode(formatJoinCode(e.target.value))
                      setJoinError('')
                    }}
                    placeholder="OWX-________"
                    maxLength={12}
                  />
                  {joinError && <p className="text-red-600 text-base">{joinError}</p>}
                  <BigButton
                    onClick={handleJoinWorkspace}
                    disabled={syncStatus === 'loading'}
                  >
                    {syncStatus === 'loading' ? t('label_loading') : t('sync_connect')}
                  </BigButton>
                  <BigButton
                    variant="secondary"
                    onClick={() => { setShowJoinInput(false); setJoinCode(''); setJoinError('') }}
                  >
                    {t('btn_cancel')}
                  </BigButton>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-600 font-bold text-lg">{t('sync_connected')}</span>
              </div>
              <p className="text-base text-gray-700">
                {t('sync_workspace_label')} <span className="font-mono font-bold text-primary-700">{workspaceId}</span>
              </p>
              <BigButton onClick={handleCopyCode}>
                {copySuccess ? t('sync_code_copied') : t('sync_copy_code')}
              </BigButton>
              <BigButton variant="outline" onClick={leaveWorkspace}>
                {t('sync_disconnect')}
              </BigButton>
              <p className="text-sm text-gray-500">
                {t('sync_active_description')}
              </p>
            </div>
          )}
        </section>

        {/* PIN */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">{t('label_change_pin')}</h2>
          {pinSuccess && <p className="text-green-600 text-lg mb-3">{t('pin_changed')}</p>}
          {!changingPin ? (
            <BigButton variant="outline" onClick={() => setChangingPin(true)}>
              🔐 {t('label_change_pin')}
            </BigButton>
          ) : (
            <div className="flex flex-col gap-3">
              <BigInput
                label={t('label_new_pin')}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                placeholder="• • • •"
              />
              <BigInput
                label={t('label_confirm_pin')}
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

        {/* Backup */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-gold-500">
          <h2 className="text-xl font-bold text-primary-700 mb-4 font-poppins">💾 Backup &amp; herstel</h2>

          {lastBackup && (
            <p className="text-base text-gray-500 mb-3">
              Laatste backup: <span className="font-semibold text-gray-700">{formatBackupDate(lastBackup)}</span>
            </p>
          )}

          {backupStatus === 'local' && <p className="text-green-600 text-base font-semibold mb-3">✅ Backup gedownload</p>}
          {backupStatus === 'firebase' && <p className="text-green-600 text-base font-semibold mb-3">✅ Firebase backup opgeslagen</p>}
          {backupStatus === 'error' && <p className="text-red-600 text-base font-semibold mb-3">❌ Backup mislukt</p>}

          <div className="flex flex-col gap-3">
            <BigButton variant="outline" onClick={handleLocalBackup}>
              📥 Backup downloaden (JSON)
            </BigButton>
            {workspaceId ? (
              <BigButton
                variant="outline"
                onClick={handleFirebaseBackup}
                disabled={backupStatus === 'saving'}
              >
                {backupStatus === 'saving' ? t('label_loading') : t('backup_firebase_btn')}
              </BigButton>
            ) : (
              <p className="text-base text-gray-400 text-center">
                {t('backup_no_workspace')}
              </p>
            )}
            <p className="text-sm text-gray-400">
              {t('backup_sync_note')}
            </p>
          </div>
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
