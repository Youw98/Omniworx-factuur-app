import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { calcBtw, formatEuro } from '../utils/btwCalc'
import { StatusBadge } from '../components/UI/StatusBadge'
import { BigButton } from '../components/UI/BigButton'

function greeting(t) {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard_greeting_morning')
  if (h < 18) return t('dashboard_greeting_afternoon')
  return t('dashboard_greeting_evening')
}

export function Dashboard() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { invoices, unpaidInvoices, overdueInvoices } = useInvoices()

  const unpaidTotal = unpaidInvoices.reduce((s, inv) => s + calcBtw(inv.lineItems || []).grandTotal, 0)
  const recent = invoices.slice(0, 5)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-800 text-white px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-1">
          <p className="text-2xl text-primary-200">{greeting(t)}</p>
          <button
            onClick={() => navigate('/instellingen')}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl hover:bg-white/20 text-2xl"
            aria-label="Instellingen"
          >⚙️</button>
        </div>
        <p className="text-3xl font-bold">Omniworx</p>
      </header>

      <div className="flex flex-col gap-5 p-5 -mt-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-base text-gray-500 mb-1">{t('dashboard_outstanding')}</p>
            <p className="text-3xl font-bold text-primary-800">{unpaidInvoices.length}</p>
            <p className="text-lg text-gray-600 mt-1">{formatEuro(unpaidTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-base text-gray-500 mb-1">{t('dashboard_overdue')}</p>
            <p className={`text-3xl font-bold ${overdueInvoices.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {overdueInvoices.length}
            </p>
            <p className="text-lg text-gray-400 mt-1">facturen</p>
          </div>
        </div>

        {/* New invoice CTA */}
        <BigButton onClick={() => navigate('/nieuw')} className="!text-2xl !min-h-[72px]">
          ➕ {t('btn_new_invoice')}
        </BigButton>

        {/* Recent invoices */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">{t('dashboard_recent')}</h2>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xl">{t('dashboard_no_invoices')}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map(inv => {
                const total = calcBtw(inv.lineItems || []).grandTotal
                return (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/facturen/${inv.id}`)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center justify-between gap-3 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-gray-800 truncate">{inv.client?.name || '—'}</p>
                      <p className="text-base text-gray-500">#{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xl font-semibold text-primary-800">{formatEuro(total)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
