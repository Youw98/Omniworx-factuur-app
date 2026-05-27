import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { InvoiceForm } from '../components/InvoiceForm/InvoiceForm'
import { PageHeader } from '../components/layout/PageHeader'

export function NewInvoice() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { createInvoice } = useInvoices()

  const handleSave = (data) => {
    const invoice = createInvoice(data)
    navigate(`/facturen/${invoice.id}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('new_invoice')} showBack backTo="/facturen" />
      <div className="p-4 pb-32">
        <InvoiceForm onSave={handleSave} onCancel={() => navigate('/facturen')} />
      </div>
    </div>
  )
}
