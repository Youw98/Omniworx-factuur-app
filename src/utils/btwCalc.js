export function formatEuro(amount) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function calcBtw(lineItems) {
  const subtotal = lineItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0)
  const btwGroups = {}
  for (const item of lineItems) {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
    const rate = item.btwRate ?? 21
    btwGroups[rate] = (btwGroups[rate] || 0) + lineTotal * rate / 100
  }
  const btwTotal = Object.values(btwGroups).reduce((s, v) => s + v, 0)
  return { subtotal, btwGroups, btwTotal, grandTotal: subtotal + btwTotal }
}
