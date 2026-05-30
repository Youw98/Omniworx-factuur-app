import { useEffect } from 'react'
import { useSyncedCollection } from './useSyncedCollection'
import { generateQuoteNumber } from '../utils/quoteNumber'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function isExpired(quote) {
  return quote.status === 'pending' && quote.validUntil < todayIso()
}

export function useQuotes() {
  const { items: quotes, upsertItem, removeItem, setItems } = useSyncedCollection('omniworx_quotes', 'quotes')

  // Auto-expire quotes on mount and when item count changes (Firestore sync)
  useEffect(() => {
    setItems(prev => {
      const updated = prev.map(q =>
        isExpired(q) ? { ...q, status: 'expired' } : q
      )
      const hasChanges = updated.some((q, i) => q.status !== prev[i].status)
      return hasChanges ? updated : prev
    })
  }, [quotes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const createQuote = (data) => {
    const quote = {
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(quotes),
      status: 'pending',
      invoiceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    upsertItem(quote)
    return quote
  }

  const updateQuote = (id, data) => {
    const existing = quotes.find(q => q.id === id)
    if (!existing) return
    upsertItem({ ...existing, ...data, updatedAt: new Date().toISOString() })
  }

  const deleteQuote = (id) => {
    removeItem(id)
  }

  const getQuote = (id) => quotes.find(q => q.id === id)

  const markAccepted = (id) => updateQuote(id, { status: 'accepted' })
  const markRejected = (id) => updateQuote(id, { status: 'rejected' })

  const pendingQuotes = quotes.filter(q => q.status === 'pending')

  return {
    quotes,
    createQuote,
    updateQuote,
    deleteQuote,
    getQuote,
    markAccepted,
    markRejected,
    pendingQuotes,
  }
}
