import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const BRAND_GREEN = '#0C3C3A'
const BRAND_GOLD = '#E7B260'

export function PdfViewerModal({ docTitle, onClose, onShare, sharing }) {
  const { t } = useTranslation('ui')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        background: BRAND_GREEN,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        flexShrink: 0,
        gap: 12,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            fontSize: 17,
            fontWeight: 600,
            padding: '12px 18px',
            borderRadius: 12,
            cursor: 'pointer',
            minHeight: 52,
          }}
        >
          ✕ {t('pdf_btn_close')}
        </button>

        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', flex: 1 }}>
          {docTitle}
        </div>

        <button
          onClick={onShare}
          disabled={sharing}
          style={{
            background: sharing ? 'rgba(231,178,96,0.5)' : BRAND_GOLD,
            border: 'none',
            color: BRAND_GREEN,
            fontSize: 17,
            fontWeight: 700,
            padding: '12px 20px',
            borderRadius: 12,
            cursor: sharing ? 'not-allowed' : 'pointer',
            minHeight: 52,
            whiteSpace: 'nowrap',
          }}
        >
          {sharing ? `⏳ ${t('pdf_btn_share')}` : `📤 ${t('pdf_btn_share')}`}
        </button>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
      }}>
        <div style={{ fontSize: 72, lineHeight: 1 }}>📄</div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
          PDF klaar om te delen
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center' }}>
          {docTitle}
        </div>

        <button
          onClick={onShare}
          disabled={sharing}
          style={{
            background: sharing ? 'rgba(231,178,96,0.5)' : BRAND_GOLD,
            border: 'none',
            color: BRAND_GREEN,
            fontSize: 20,
            fontWeight: 700,
            padding: '18px 48px',
            borderRadius: 16,
            cursor: sharing ? 'not-allowed' : 'pointer',
            minHeight: 64,
            fontFamily: 'Poppins, sans-serif',
            marginTop: 8,
          }}
        >
          {sharing ? '⏳ Bezig...' : '📤 Delen'}
        </button>
      </div>
    </div>
  )
}
