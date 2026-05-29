import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuotes } from '../hooks/useQuotes'
import { calcBtw, formatEuro } from '../utils/btwCalc'
import { StatusBadge } from '../components/UI/StatusBadge'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/UI/EmptyState'
import { BigButton } from '../components/UI/BigButton'

const TABS = ['all', 'pending', 'accepted', 'rejected_expired']

export function Quotes() {
  const { t } = useTranslation('ui')
  const navigate = useNavigate()
  const { quotes } = useQuotes()
  const [tab, setTab] = useState('all')

  const filtered = quotes.filter(q => {
    if (tab === 'all') return true
    if (tab === 'pending') return q.status === 'pending'
    if (tab === 'accepted') return q.status === 'accepted'
    if (tab === 'rejected_expired') return q.status === 'rejected' || q.status === 'expired'
    return true
  })

  const tabLabel = {
    all: t('quotes_all'),
    pending: t('quotes_pending'),
    accepted: t('quotes_accepted'),
    rejected_expired: t('quotes_rejected_expired'),
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('quotes_title')} />

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
        {filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            message={t('quotes_empty')}
            action={<BigButton onClick={() => navigate('/offerten/nieuw')}>{t('btn_new_quote')}</BigButton>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(q => {
              const total = calcBtw(q.lineItems || []).grandTotal
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/offerten/${q.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center gap-4 hover:border-gold-400 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-gray-800 truncate">{q.client?.name || '—'}</p>
                    <p className="text-base text-gray-500">#{q.quoteNumber} · {new Date(q.date).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <p className="text-xl font-bold text-primary-700">{formatEuro(total)}</p>
                    <StatusBadge status={q.status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
