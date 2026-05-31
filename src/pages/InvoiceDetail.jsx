import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { useToast } from '../hooks/useToast'
import { InvoicePreview } from '../components/InvoicePreview/InvoicePreview'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { StatusBadge } from '../components/UI/StatusBadge'
import { ConfirmDialog } from '../components/UI/ConfirmDialog'
import { ScaledPreview } from '../components/UI/ScaledPreview'
import { PdfViewerModal } from '../components/UI/PdfViewerModal'
import { generateInvoicePdf, mergeWithAV } from '../utils/pdf'
import { shareInvoicePdf } from '../utils/share'

export function InvoiceDetail() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getInvoice, markPaid, markUnpaid, deleteInvoice } = useInvoices()
  const showToast = useToast()
  const invoice = getInvoice(id)
  const previewRef = useRef(null)

  const [generating, setGenerating] = useState(false)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [previewDataUrl, setPreviewDataUrl] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <p className="text-2xl text-gray-500">Factuur niet gevonden</p>
        <BigButton onClick={() => navigate('/facturen')} className="mt-6 max-w-xs">{t('btn_back')}</BigButton>
      </div>
    )
  }

  const handlePreview = async () => {
    setGenerating(true)
    setError('')
    try {
      const { blob, previewDataUrl: dataUrl } = await generateInvoicePdf(previewRef.current, invoice.invoiceNumber)
      // Pre-merge AV so share fires instantly from the button tap (no async gap)
      const merged = await mergeWithAV(blob)
      setPdfBlob(merged)
      setPreviewDataUrl(dataUrl)
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
      const shared = await shareInvoicePdf(pdfBlob, invoice.invoiceNumber)
      if (!shared) setError(t('error_share'))
    } catch {
      setError(t('error_pdf'))
    } finally {
      setSharing(false)
    }
  }

  const handleCloseViewer = () => {
    setPreviewDataUrl(null)
    setPdfBlob(null)
  }

  const handleDelete = () => {
    deleteInvoice(id)
    showToast(t('toast_invoice_deleted'))
    navigate('/facturen', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <PageHeader
        title={invoice.invoiceNumber}
        showBack
        backTo="/facturen"
      />

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={invoice.status} />
          <span className="text-lg font-bold text-primary-700 font-poppins">#{invoice.invoiceNumber}</span>
        </div>

        <BigButton onClick={handlePreview} disabled={generating}>
          {generating ? t('btn_generating_pdf') : `👁️ Bekijken & Delen`}
        </BigButton>
        {error && <p className="text-red-600 text-base text-center">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          {invoice.status !== 'paid' ? (
            <BigButton variant="success" onClick={() => { markPaid(id); showToast(t('toast_marked_paid')) }}>{t('btn_mark_paid_short')}</BigButton>
          ) : (
            <BigButton variant="secondary" onClick={() => { markUnpaid(id); showToast(t('toast_marked_unpaid')) }}>{t('btn_mark_unpaid_short')}</BigButton>
          )}
          <BigButton variant="secondary" onClick={() => navigate(`/facturen/${id}/bewerken`)}>✏️ {t('btn_edit')}</BigButton>
        </div>
        <BigButton variant="danger" onClick={() => setShowDelete(true)}>🗑️ {t('btn_delete')}</BigButton>
      </div>

      {/* Invoice preview scaled to fit screen */}
      <div className="flex-1 p-4 pb-24 overflow-hidden">
        <ScaledPreview>
          <InvoicePreview ref={previewRef} invoice={invoice} />
        </ScaledPreview>
      </div>

      {previewDataUrl && (
        <PdfViewerModal
          previewDataUrl={previewDataUrl}
          onClose={handleCloseViewer}
          onShare={handleShare}
          sharing={sharing}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          message={t('confirm_delete_invoice')}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
