import { useEffect } from 'react'
import { useSyncedCollection } from './useSyncedCollection'
import { generateInvoiceNumber } from '../utils/invoiceNumber'

function isOverdue(invoice) {
  return invoice.status === 'unpaid' && new Date(invoice.dueDate) < new Date(new Date().toDateString())
}

export function useInvoices() {
  const { items: invoices, upsertItem, removeItem, setItems } = useSyncedCollection('omniworx_invoices', 'invoices')

  // Auto-update overdue status on mount and when item count changes (Firestore sync)
  useEffect(() => {
    setItems(prev => {
      const updated = prev.map(inv =>
        isOverdue(inv) ? { ...inv, status: 'overdue' } : inv
      )
      const hasChanges = updated.some((inv, i) => inv.status !== prev[i].status)
      return hasChanges ? updated : prev
    })
  }, [invoices.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const createInvoice = (data) => {
    const invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(invoices),
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    upsertItem(invoice)
    return invoice
  }

  const updateInvoice = (id, data) => {
    const existing = invoices.find(inv => inv.id === id)
    if (!existing) return
    upsertItem({ ...existing, ...data, updatedAt: new Date().toISOString() })
  }

  const deleteInvoice = (id) => {
    removeItem(id)
  }

  const getInvoice = (id) => invoices.find(inv => inv.id === id)

  const markPaid = (id) => updateInvoice(id, { status: 'paid' })
  const markUnpaid = (id) => {
    const inv = invoices.find(i => i.id === id)
    if (!inv) return
    const status = isOverdue(inv) ? 'overdue' : 'unpaid'
    updateInvoice(id, { status })
  }

  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid')
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')

  return {
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    markPaid,
    markUnpaid,
    unpaidInvoices,
    overdueInvoices,
  }
}
