import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuotes } from '../hooks/useQuotes'
import { useSettings } from '../hooks/useSettings'
import { InvoiceForm } from '../components/InvoiceForm/InvoiceForm'
import { PageHeader } from '../components/layout/PageHeader'

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function NewQuote() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { createQuote } = useQuotes()
  const { settings } = useSettings()
  const validDays = settings.defaultValidDays ?? 30

  const handleSave = (data) => {
    const quote = createQuote({
      date: data.date,
      validUntil: data.dueDate,
      invoiceLanguage: data.invoiceLanguage,
      lineItems: data.lineItems,
      notes: data.notes,
      client: data.client,
    })
    navigate(`/offerten/${quote.id}`, { replace: true })
  }

  const initialData = {
    date: todayIso(),
    dueDate: addDays(todayIso(), validDays),
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('new_quote')} showBack backTo="/offerten" />
      <div className="p-4 pb-32">
        <InvoiceForm
          initial={initialData}
          onSave={handleSave}
          onCancel={() => navigate('/offerten')}
          dueDateLabel={t('label_valid_until')}
          defaultDays={validDays}
        />
      </div>
    </div>
  )
}
