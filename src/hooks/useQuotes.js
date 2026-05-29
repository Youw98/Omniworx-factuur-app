import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateQuoteNumber } from '../utils/quoteNumber'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function isExpired(quote) {
  return quote.status === 'pending' && quote.validUntil < todayIso()
}

export function useQuotes() {
  const [quotes, setQuotes] = useLocalStorage('omniworx_quotes', [])

  // Auto-expire quotes on mount
  useEffect(() => {
    setQuotes(prev => {
      const updated = prev.map(q =>
        isExpired(q) ? { ...q, status: 'expired' } : q
      )
      const hasChanges = updated.some((q, i) => q.status !== prev[i].status)
      return hasChanges ? updated : prev
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setQuotes(prev => [quote, ...prev])
    return quote
  }

  const updateQuote = (id, data) => {
    setQuotes(prev =>
      prev.map(q =>
        q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q
      )
    )
  }

  const deleteQuote = (id) => {
    setQuotes(prev => prev.filter(q => q.id !== id))
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
