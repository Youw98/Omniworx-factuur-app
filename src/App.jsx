import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from './hooks/useSettings'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { ToastProvider, useToast } from './hooks/useToast'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { PinLock } from './components/UI/PinLock'
import { BottomNav } from './components/layout/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { InvoiceList } from './pages/InvoiceList'
import { NewInvoice } from './pages/NewInvoice'
import { InvoiceDetail } from './pages/InvoiceDetail'
import { EditInvoice } from './pages/EditInvoice'
import { Quotes } from './pages/Quotes'
import { NewQuote } from './pages/NewQuote'
import { QuoteDetail } from './pages/QuoteDetail'
import { EditQuote } from './pages/EditQuote'
import { Clients } from './pages/Clients'
import { Settings } from './pages/Settings'

function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="fixed top-0 left-0 right-0 max-w-lg mx-auto bg-orange-500 text-white text-center text-lg font-semibold py-2 z-[60] shadow-lg">
      📵 Geen internetverbinding
    </div>
  )
}


function AppContent() {
  const { settings, updateSetting } = useSettings()
  const { i18n, t } = useTranslation('ui')
  const location = useLocation()
  const [unlocked, setUnlocked] = useState(false)
  const showToast = useToast()

  useEffect(() => {
    const lang = settings.uiLanguage || 'nl'
    if (i18n.language !== lang) i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [settings.uiLanguage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => showToast(t('error_storage_full'), 'error')
    window.addEventListener('omniworx:storage-error', handler)
    return () => window.removeEventListener('omniworx:storage-error', handler)
  }, [showToast, t])

  const handleSetPin = (hash) => {
    updateSetting('pinHash', hash)
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <PinLock
        pinHash={settings.pinHash}
        onUnlock={() => setUnlocked(true)}
        onSetPin={handleSetPin}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/facturen" element={<InvoiceList />} />
        <Route path="/facturen/nieuw" element={<NewInvoice key={location.key} />} />
        <Route path="/facturen/:id" element={<InvoiceDetail />} />
        <Route path="/facturen/:id/bewerken" element={<EditInvoice />} />
        <Route path="/nieuw" element={<NewInvoice key={location.key} />} />
        <Route path="/offerten" element={<Quotes />} />
        <Route path="/offerten/nieuw" element={<NewQuote key={location.key} />} />
        <Route path="/offerten/:id" element={<QuoteDetail />} />
        <Route path="/offerten/:id/bewerken" element={<EditQuote />} />
        <Route path="/klanten" element={<Clients />} />
        <Route path="/instellingen" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  )
}
