export function generateQuoteNumber(quotes = []) {
  const year = new Date().getFullYear()
  const prefix = `OFF-${year}-`
  const seqs = quotes
    .filter(q => q.quoteNumber?.startsWith(prefix))
    .map(q => parseInt(q.quoteNumber.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1
  return `OFF-${year}-${String(next).padStart(3, '0')}`
}
