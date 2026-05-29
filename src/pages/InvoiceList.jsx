import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../hooks/useInvoices'
import { calcBtw, formatEuro } from '../utils/btwCalc'
import { exportInvoicesToExcel } from '../utils/excelExport'
import { StatusBadge } from '../components/UI/StatusBadge'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/UI/EmptyState'
import { BigButton } from '../components/UI/BigButton'

const TABS = ['all', 'unpaid', 'overdue', 'paid']

const NL_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

function monthLabel(dateStr) {
  const d = new Date(dateStr)
  return `${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function groupByMonth(invoices) {
  const groups = {}
  for (const inv of invoices) {
    const key = monthKey(inv.date)
    if (!groups[key]) groups[key] = { label: monthLabel(inv.date), items: [] }
    groups[key].items.push(inv)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v)
}

export function InvoiceList() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { invoices } = useInvoices()
  const [tab, setTab] = useState('all')
  const [exporting, setExporting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const filtered = invoices.filter(inv => {
    const isOverdue = inv.status !== 'paid' && inv.dueDate < today
    if (tab === 'all') return true
    if (tab === 'unpaid') return inv.status === 'unpaid' && !isOverdue
    if (tab === 'overdue') return isOverdue
    if (tab === 'paid') return inv.status === 'paid'
    return true
  })

  const monthGroups = groupByMonth(filtered)

  const tabLabel = { all: t('invoices_all'), unpaid: t('invoices_unpaid'), overdue: t('invoices_overdue'), paid: t('invoices_paid') }

  const handleExport = () => {
    if (invoices.length === 0) return
    setExporting(true)
    try {
      exportInvoicesToExcel(invoices)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title={t('nav_invoices')}
        rightAction={
          <button
            onClick={() => navigate('/nieuw')}
            className="min-w-[56px] min-h-[56px] flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-gold-300 text-3xl"
            aria-label={t('btn_new_invoice')}
          >＋</button>
        }
      />

      {/* Filter tabs */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {TABS.map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`min-h-[56px] px-4 rounded-xl text-lg font-semibold whitespace-nowrap transition-colors ${
                tab === key ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tabLabel[key]}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 p-4 pb-24">
        {/* Export button */}
        {invoices.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full mb-4 min-h-[52px] bg-white border-2 border-primary-700 text-primary-700 font-semibold text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            📊 {t('btn_export_excel')}
          </button>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon="📄"
            message={t('invoices_empty')}
            action={<BigButton onClick={() => navigate('/nieuw')}>{t('btn_new_invoice')}</BigButton>}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {monthGroups.map(group => (
              <div key={group.label}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-1 h-5 rounded-full bg-gold-500" />
                  <h2 className="text-sm font-bold text-primary-700 font-poppins uppercase tracking-widest">
                    {group.label}
                  </h2>
                  <div className="flex-1 h-px bg-gold-400 opacity-30" />
                  <span className="text-sm font-semibold text-gold-600 font-poppins">
                    {formatEuro(group.items.reduce((s, inv) => s + calcBtw(inv.lineItems || []).grandTotal, 0))}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {group.items.map(inv => {
                    const total = calcBtw(inv.lineItems || []).grandTotal
                    return (
                      <button
                        key={inv.id}
                        onClick={() => navigate(`/facturen/${inv.id}`)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center gap-4 hover:border-gold-400 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xl font-bold text-gray-800 truncate">{inv.client?.name || '—'}</p>
                          <p className="text-base text-gray-500">#{inv.invoiceNumber} · {new Date(inv.date).toLocaleDateString('nl-NL')}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                          <p className="text-xl font-bold text-primary-700">{formatEuro(total)}</p>
                          <StatusBadge status={inv.status} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
