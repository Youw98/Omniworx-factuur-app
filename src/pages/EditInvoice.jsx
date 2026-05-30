import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { useToast } from '../hooks/useToast'
import { InvoiceForm } from '../components/InvoiceForm/InvoiceForm'
import { PageHeader } from '../components/layout/PageHeader'

export function EditInvoice() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getInvoice, updateInvoice } = useInvoices()
  const showToast = useToast()
  const invoice = getInvoice(id)

  if (!invoice) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <p className="text-2xl text-gray-500">Factuur niet gevonden</p>
      <button onClick={() => navigate('/facturen')} className="min-h-[56px] px-8 bg-primary-700 text-white text-xl rounded-2xl">{t('btn_back')}</button>
    </div>
  )

  const handleSave = (data) => {
    updateInvoice(id, data)
    showToast(t('toast_invoice_updated'))
    navigate(`/facturen/${id}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('edit_invoice')} showBack backTo={`/facturen/${id}`} />
      <div className="p-4 pb-32">
        <InvoiceForm initial={invoice} onSave={handleSave} onCancel={() => navigate(`/facturen/${id}`)} />
      </div>
    </div>
  )
}
