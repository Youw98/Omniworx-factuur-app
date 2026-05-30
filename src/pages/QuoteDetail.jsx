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
import { PdfViewerModal } from '../components/UI/PdfViewerModal'
import { generateQuotePdf, mergeWithAV } from '../utils/pdf'
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

  const [generating, setGenerating] = useState(false)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [showReject, setShowReject] = useState(false)

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <p className="text-2xl text-gray-500">Offerte niet gevonden</p>
        <BigButton onClick={() => navigate('/offerten')} className="mt-6 max-w-xs">{t('btn_back')}</BigButton>
      </div>
    )
  }

  const handlePreview = async () => {
    setGenerating(true)
    setError('')
    try {
      const blob = await generateQuotePdf(previewRef.current, quote.quoteNumber)
      const url = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfUrl(url)
    } catch (e) {
      console.error(e)
      setError(t('error_pdf'))
    } finally {
      setGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!pdfBlob) return
    setSharing(true)
    try {
      const blobToShare = await mergeWithAV(pdfBlob)
      const shared = await shareInvoicePdf(blobToShare, quote.quoteNumber)
      if (!shared) setError(t('error_share'))
    } catch {
      setError(t('error_pdf'))
    } finally {
      setSharing(false)
    }
  }

  const handleCloseViewer = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlob(null)
  }

  const handleDelete = () => {
    deleteQuote(id)
    showToast(t('toast_quote_deleted'))
    navigate('/offerten', { replace: true })
  }

  const handleReject = () => {
    markRejected(id)
    showToast(t('toast_marked_rejected'))
    setShowReject(false)
  }

  const handleConvert = () => {
    if (quote.invoiceId) return
    const invoice = createInvoice({
      date: new Date().toISOString().split('T')[0],
      dueDate: addDays(new Date().toISOString().split('T')[0], settings.defaultDueDays || 14),
      invoiceLanguage: quote.invoiceLanguage,
      lineItems: quote.lineItems,
      notes: quote.notes,
      client: quote.client,
    })
    updateQuote(quote.id, { invoiceId: invoice.id })
    showToast(t('quote_converted'))
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
        <div className="flex items-center justify-between">
          <StatusBadge status={quote.status} />
          <span className="text-lg font-bold text-primary-700 font-poppins">#{quote.quoteNumber}</span>
        </div>

        <BigButton onClick={handlePreview} disabled={generating}>
          {generating ? t('btn_generating_pdf') : `👁️ Bekijken & Delen`}
        </BigButton>
        {error && <p className="text-red-600 text-base text-center">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          {quote.status === 'pending' && (
            <BigButton variant="success" onClick={() => { markAccepted(id); showToast(t('toast_marked_accepted')) }}>{t('btn_mark_accepted')}</BigButton>
          )}
          <BigButton variant="secondary" onClick={() => navigate(`/offerten/${id}/bewerken`)}>✏️ {t('btn_edit')}</BigButton>
        </div>

        {quote.status === 'pending' && (
          <BigButton variant="danger" onClick={() => setShowReject(true)}>{t('btn_mark_rejected')}</BigButton>
        )}

        {quote.status === 'accepted' && !quote.invoiceId && (
          <BigButton variant="dark" onClick={() => setShowConvert(true)}>📄 {t('btn_convert_to_invoice')}</BigButton>
        )}

        <BigButton variant="danger" onClick={() => setShowDelete(true)}>🗑️ {t('btn_delete')}</BigButton>
      </div>

      {/* Quote preview scaled to fit screen */}
      <div className="flex-1 p-4 pb-24 overflow-hidden">
        <ScaledPreview>
          <QuotePreview ref={previewRef} quote={quote} />
        </ScaledPreview>
      </div>

      {pdfUrl && (
        <PdfViewerModal
          url={pdfUrl}
          onClose={handleCloseViewer}
          onShare={handleShare}
          sharing={sharing}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          message={t('confirm_delete_quote')}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showReject && (
        <ConfirmDialog
          message={t('confirm_reject_quote')}
          confirmLabel={t('btn_confirm_reject')}
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
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
