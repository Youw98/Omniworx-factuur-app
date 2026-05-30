import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const BRAND_GREEN = '#0C3C3A'
const BRAND_GOLD = '#E7B260'

export function PdfViewerModal({ url, onClose, onShare, sharing }) {
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
      background: '#111',
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

        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', flex: 1 }}>
          {t('pdf_pinch_zoom')}
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

      {/* PDF viewer */}
      <iframe
        src={url}
        style={{ flex: 1, width: '100%', border: 'none', background: '#555' }}
        title="PDF voorbeeld"
      />
    </div>
  )
}
