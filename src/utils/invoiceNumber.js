export function generateInvoiceNumber(invoices = []) {
  const year = new Date().getFullYear()
  const prefix = `${year}-`
  const seqs = invoices
    .filter(inv => inv.invoiceNumber?.startsWith(prefix))
    .map(inv => parseInt(inv.invoiceNumber.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1
  return `${year}-${String(next).padStart(3, '0')}`
}
