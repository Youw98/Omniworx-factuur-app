import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { useQuotes } from '../hooks/useQuotes'
import { calcBtw, formatEuro } from '../utils/btwCalc'
import { StatusBadge } from '../components/UI/StatusBadge'
import { BigButton } from '../components/UI/BigButton'
import { OmniworxWordmark, BuildingsIcon, HardHatIcon } from '../components/UI/OmniworxLogo'

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
  const { pendingQuotes } = useQuotes()

  const unpaidTotal = unpaidInvoices.reduce((s, inv) => s + calcBtw(inv.lineItems || []).grandTotal, 0)
  const recent = invoices.slice(0, 5)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Brand Header */}
      <header className="bg-primary-700 text-white px-5 pt-0 pb-10">
        <div className="h-1.5 bg-gold-500 w-full -mx-5 mb-5" style={{ width: 'calc(100% + 40px)' }} />
        <div className="flex items-center justify-between mb-4">
          <OmniworxWordmark height={44} />
          <button
            onClick={() => navigate('/instellingen')}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl hover:bg-white/20 text-2xl transition-colors"
            aria-label="Instellingen"
          >⚙️</button>
        </div>
        <p className="text-gold-300/80 text-lg font-poppins">{greeting(t)}</p>
      </header>

      <div className="flex flex-col gap-5 p-5 -mt-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-gold-500">
            <BuildingsIcon size={28} color="#E7B260" className="mb-2"/>
            <p className="text-xs text-gray-500 mb-1 font-poppins font-semibold uppercase tracking-wider">{t('dashboard_outstanding')}</p>
            <p className="text-3xl font-bold text-primary-700 font-poppins">{unpaidInvoices.length}</p>
            <p className="text-base text-gray-500 mt-1">{formatEuro(unpaidTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-red-400">
            <HardHatIcon size={28} color="#dc2626" className="mb-2"/>
            <p className="text-xs text-gray-500 mb-1 font-poppins font-semibold uppercase tracking-wider">{t('dashboard_overdue')}</p>
            <p className={`text-3xl font-bold font-poppins ${overdueInvoices.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>{overdueInvoices.length}</p>
            <p className="text-base text-gray-400 mt-1">{t('dashboard_invoices_label')}</p>
          </div>
        </div>

        {/* New invoice CTA */}
        <div className="grid grid-cols-2 gap-3">
          <BigButton onClick={() => navigate('/nieuw')} className="!text-xl !min-h-[64px] shadow-lg">
            ➕ {t('btn_new_invoice')}
          </BigButton>
          <button
            onClick={() => navigate('/offerten/nieuw')}
            className="min-h-[64px] bg-white border-2 border-primary-700 text-primary-700 font-semibold text-xl rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary-50 transition-colors relative"
          >
            📋 {t('btn_new_quote')}
            {pendingQuotes.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1">
                {pendingQuotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Recent invoices */}
        <div>
          <h2 className="text-xl font-bold text-primary-700 mb-3 font-poppins">{t('dashboard_recent')}</h2>
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
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center justify-between gap-3 hover:border-gold-400 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-gray-800 truncate font-poppins">{inv.client?.name || '—'}</p>
                      <p className="text-base text-gray-500">#{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xl font-bold text-primary-700 font-poppins">{formatEuro(total)}</p>
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
