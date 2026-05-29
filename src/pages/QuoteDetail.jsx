import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuotes } from '../hooks/useQuotes'
import { useInvoices } from '../hooks/useInvoices'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'
import { QuotePreview } from '../components/QuotePreview/QuotePreview'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { StatusBadge } from '../components/UI/StatusBadge'
import { ConfirmDialog } from '../components/UI/ConfirmDialog'
import { ScaledPreview } from '../components/UI/ScaledPreview'
import { generateInvoicePdf } from '../utils/pdf'
import { shareInvoicePdf } from '../utils/share'

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function QuoteDetail() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getQuote, markAccepted, markRejected, deleteQuote, updateQuote } = useQuotes()
  const { createInvoice } = useInvoices()
  const { settings } = useSettings()
  const showToast = useToast()
  const quote = getQuote(id)
  const previewRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <p className="text-2xl text-gray-500">Offerte niet gevonden</p>
        <BigButton onClick={() => navigate('/offerten')} className="mt-6 max-w-xs">Terug</BigButton>
      </div>
    )
  }

  const handleShare = async () => {
    setSharing(true)
    setShareError('')
    try {
      const blob = await generateInvoicePdf(previewRef.current, quote.quoteNumber)
      const shared = await shareInvoicePdf(blob, quote.quoteNumber)
      if (!shared) setShareError(t('error_share'))
    } catch (e) {
      console.error(e)
      setShareError(t('error_pdf'))
    } finally {
      setSharing(false)
    }
  }

  const handleDelete = () => {
    deleteQuote(id)
    navigate('/offerten', { replace: true })
  }

  const handleConvert = () => {
    const invoice = createInvoice({
      date: new Date().toISOString().split('T')[0],
      dueDate: addDays(new Date().toISOString().split('T')[0], settings.defaultDueDays || 14),
      invoiceLanguage: quote.invoiceLanguage,
      lineItems: quote.lineItems,
      notes: quote.notes,
      client: quote.client,
    })
    updateQuote(quote.id, { invoiceId: invoice.id })
    navigate(`/facturen/${invoice.id}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <PageHeader
        title={quote.quoteNumber}
        showBack
        backTo="/offerten"
      />

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-200 p-4 flex flex-col gap-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={quote.status} />
          <span className="text-lg font-bold text-primary-700 font-poppins">#{quote.quoteNumber}</span>
        </div>

        {/* Share button */}
        <BigButton onClick={handleShare} disabled={sharing}>
          {sharing ? t('btn_generating_pdf') : `📤 ${t('btn_share')}`}
        </BigButton>
        {shareError && (
          <div className="flex items-center gap-3">
            <p className="text-red-600 text-base flex-1 text-center">{shareError}</p>
            <button onClick={handleShare} className="min-h-[44px] px-4 text-base font-semibold text-primary-700 border border-primary-700 rounded-xl">
              {t('btn_retry')}
            </button>
          </div>
        )}

        {/* Accept + Edit row */}
        <div className="grid grid-cols-2 gap-3">
          {quote.status === 'pending' && (
            <BigButton variant="success" onClick={() => { markAccepted(id); showToast(t('toast_marked_accepted')) }}>{t('btn_mark_accepted')}</BigButton>
          )}
          <BigButton variant="secondary" onClick={() => navigate(`/offerten/${id}/bewerken`)}>✏️ {t('btn_edit')}</BigButton>
        </div>

        {/* Reject button — only if pending */}
        {quote.status === 'pending' && (
          <BigButton variant="danger" onClick={() => { markRejected(id); showToast(t('toast_marked_rejected')) }}>{t('btn_mark_rejected')}</BigButton>
        )}

        {/* Convert to invoice — only if accepted and not yet converted */}
        {quote.status === 'accepted' && !quote.invoiceId && (
          <BigButton variant="dark" onClick={() => setShowConvert(true)}>📄 {t('btn_convert_to_invoice')}</BigButton>
        )}

        {/* Delete button */}
        <BigButton variant="danger" onClick={() => setShowDelete(true)}>🗑️ {t('btn_delete')}</BigButton>
      </div>

      {/* Quote preview — rendered at A4 width (780px), scaled down to fit screen */}
      <div className="flex-1 p-4 pb-24 overflow-hidden">
        <ScaledPreview>
          <QuotePreview ref={previewRef} quote={quote} />
        </ScaledPreview>
      </div>

      {showDelete && (
        <ConfirmDialog
          message={t('confirm_delete_quote')}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showConvert && (
        <ConfirmDialog
          message={t('confirm_convert_quote')}
          confirmLabel={t('btn_confirm_convert')}
          onConfirm={handleConvert}
          onCancel={() => setShowConvert(false)}
        />
      )}
    </div>
  )
}
