import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { InvoicePreview } from '../components/InvoicePreview/InvoicePreview'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { StatusBadge } from '../components/UI/StatusBadge'
import { ConfirmDialog } from '../components/UI/ConfirmDialog'
import { generateInvoicePdf } from '../utils/pdf'
import { shareInvoicePdf } from '../utils/share'

export function InvoiceDetail() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getInvoice, markPaid, markUnpaid, deleteInvoice } = useInvoices()
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
        title={`#${invoice.invoiceNumber}`}
        showBack
        backTo="/facturen"
        rightAction={
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
          </div>
        }
      />

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-200 p-4 flex flex-col gap-3">
        <BigButton onClick={handleShare} disabled={sharing}>
          {sharing ? t('btn_generating_pdf') : `📤 ${t('btn_share')}`}
        </BigButton>
        {shareError && <p className="text-red-600 text-base text-center">{shareError}</p>}
        <div className="grid grid-cols-2 gap-3">
          {invoice.status !== 'paid' ? (
            <BigButton variant="success" onClick={() => markPaid(id)}>✅ {t('btn_mark_paid')}</BigButton>
          ) : (
            <BigButton variant="secondary" onClick={() => markUnpaid(id)}>{t('btn_mark_unpaid')}</BigButton>
          )}
          <BigButton variant="secondary" onClick={() => navigate(`/facturen/${id}/bewerken`)}>✏️ {t('btn_edit')}</BigButton>
        </div>
        <BigButton variant="danger" onClick={() => setShowDelete(true)}>🗑️ {t('btn_delete')}</BigButton>
      </div>

      {/* Invoice preview */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <InvoicePreview ref={previewRef} invoice={invoice} />
        </div>
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
