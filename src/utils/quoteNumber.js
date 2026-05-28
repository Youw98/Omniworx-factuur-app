export function generateQuoteNumber() {
  const year = new Date().getFullYear()
  const seqKey = `omniworx_quote_seq_${year}`
  const current = parseInt(localStorage.getItem(seqKey) || '0', 10)
  const next = current + 1
  localStorage.setItem(seqKey, String(next))
  return `OFF-${year}-${String(next).padStart(3, '0')}`
}
