import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateInvoiceNumber } from '../utils/invoiceNumber'

function isOverdue(invoice) {
  return invoice.status === 'unpaid' && new Date(invoice.dueDate) < new Date(new Date().toDateString())
}

export function useInvoices() {
  const [invoices, setInvoices] = useLocalStorage('omniworx_invoices', [])

  // Auto-update overdue status on mount
  useEffect(() => {
    setInvoices(prev => {
      const updated = prev.map(inv =>
        isOverdue(inv) ? { ...inv, status: 'overdue' } : inv
      )
      const hasChanges = updated.some((inv, i) => inv.status !== prev[i].status)
      return hasChanges ? updated : prev
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const createInvoice = (data) => {
    const invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(invoices),
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }
    setInvoices(prev => [invoice, ...prev])
    return invoice
  }

  const updateInvoice = (id, data) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
      )
    )
  }

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const getInvoice = (id) => invoices.find(inv => inv.id === id)

  const markPaid = (id) => updateInvoice(id, { status: 'paid' })
  const markUnpaid = (id) => updateInvoice(id, { status: 'unpaid' })

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
