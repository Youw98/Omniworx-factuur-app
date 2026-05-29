import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuotes } from '../hooks/useQuotes'
import { useToast } from '../hooks/useToast'
import { InvoiceForm } from '../components/InvoiceForm/InvoiceForm'
import { PageHeader } from '../components/layout/PageHeader'

export function EditQuote() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { id } = useParams()
  const { getQuote, updateQuote } = useQuotes()
  const showToast = useToast()
  const quote = getQuote(id)

  if (!quote) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <p className="text-2xl text-gray-500">Offerte niet gevonden</p>
      <button onClick={() => navigate('/offerten')} className="min-h-[56px] px-8 bg-primary-700 text-white text-xl rounded-2xl">Terug</button>
    </div>
  )

  // Map quote fields to InvoiceForm shape (dueDate = validUntil)
  const initialData = {
    date: quote.date,
    dueDate: quote.validUntil,
    invoiceLanguage: quote.invoiceLanguage,
    lineItems: quote.lineItems,
    notes: quote.notes,
    client: quote.client,
  }

  const handleSave = (data) => {
    updateQuote(id, {
      date: data.date,
      validUntil: data.dueDate,
      invoiceLanguage: data.invoiceLanguage,
      lineItems: data.lineItems,
      notes: data.notes,
      client: data.client,
    })
    showToast(t('toast_quote_updated'))
    navigate(`/offerten/${id}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('edit_quote')} showBack backTo={`/offerten/${id}`} />
      <div className="p-4 pb-32">
        <InvoiceForm
          initial={initialData}
          onSave={handleSave}
          onCancel={() => navigate(`/offerten/${id}`)}
          dueDateLabel={t('label_valid_until')}
          defaultDays={30}
        />
      </div>
    </div>
  )
}
