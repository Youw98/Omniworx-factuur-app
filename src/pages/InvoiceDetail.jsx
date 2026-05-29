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
import { generateInvoicePdf } from '../utils/pdf'
import { shareInvoicePdf } from '../utils/share'

export function InvoiceDetail() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getInvoice, markPaid, markUnpaid, deleteInvoice } = useInvoices()
  const showToast = useToast()
  const invoice = getInvoice(id)
  const previewRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <p className="text-2xl text-gray-500">Factuur niet gevonden</p>
        <BigButton onClick={() => navigate('/facturen')} className="mt-6 max-w-xs">Terug</BigButton>
      </div>
    )
  }

  const handleShare = async () => {
    setSharing(true)
    setShareError('')
    try {
      const blob = await generateInvoicePdf(previewRef.current, invoice.invoiceNumber)
      const shared = await shareInvoicePdf(blob, invoice.invoiceNumber)
      if (!shared) setShareError(t('error_share'))
    } catch (e) {
      console.error(e)
      setShareError(t('error_pdf'))
    } finally {
      setSharing(false)
    }
  }

  const handleDelete = () => {
    deleteInvoice(id)
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
        {/* Status row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={invoice.status} />
          <span className="text-lg font-bold text-primary-700 font-poppins">#{invoice.invoiceNumber}</span>
        </div>
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

      {/* Invoice preview — rendered at A4 width (780px), scaled down to fit screen */}
      <div className="flex-1 p-4 pb-24 overflow-hidden">
        <ScaledPreview>
          <InvoicePreview ref={previewRef} invoice={invoice} />
        </ScaledPreview>
      </div>

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
