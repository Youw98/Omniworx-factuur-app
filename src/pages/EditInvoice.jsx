import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { InvoiceForm } from '../components/InvoiceForm/InvoiceForm'
import { PageHeader } from '../components/layout/PageHeader'

export function EditInvoice() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getInvoice, updateInvoice } = useInvoices()
  const invoice = getInvoice(id)

  if (!invoice) return <div className="p-8 text-center text-xl">Factuur niet gevonden</div>

  const handleSave = (data) => {
    updateInvoice(id, data)
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
