import * as XLSX from 'xlsx'
import { calcBtw } from './btwCalc'

const NL_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(dateStr) {
  const d = new Date(dateStr)
  return `${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function invoiceToRow(inv) {
  const { subtotal, btwGroups, grandTotal } = calcBtw(inv.lineItems || [])
  const btwTotal = Object.values(btwGroups).reduce((s, v) => s + v, 0)
  return {
    Naam: inv.client?.name || '',
    Factuurnummer: inv.invoiceNumber,
    Datum: inv.date,
    'Excl. BTW': +subtotal.toFixed(2),
    'BTW bedrag': +btwTotal.toFixed(2),
    'Totaal incl. BTW': +grandTotal.toFixed(2),
    Status: inv.status,
  }
}

export function exportInvoicesToExcel(invoices) {
  const wb = XLSX.utils.book_new()

  // Group by month
  const groups = {}
  for (const inv of invoices) {
    const key = monthKey(inv.date)
    if (!groups[key]) groups[key] = { label: monthLabel(inv.date), items: [] }
    groups[key].items.push(inv)
  }

  const sortedKeys = Object.keys(groups).sort()

  // One sheet per month
  for (const key of sortedKeys) {
    const { label, items } = groups[key]
    const rows = items.map(invoiceToRow)

    // Totals row
    const totalsRow = {
      Naam: 'TOTAAL',
      Factuurnummer: '',
      Datum: '',
      'Excl. BTW': +rows.reduce((s, r) => s + r['Excl. BTW'], 0).toFixed(2),
      'BTW bedrag': +rows.reduce((s, r) => s + r['BTW bedrag'], 0).toFixed(2),
      'Totaal incl. BTW': +rows.reduce((s, r) => s + r['Totaal incl. BTW'], 0).toFixed(2),
      Status: '',
    }

    const ws = XLSX.utils.json_to_sheet([...rows, totalsRow])
    applyColumnWidths(ws, rows)
    XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31))
  }

  // Summary sheet with all invoices + grand totals
  const allRows = invoices.map(invoiceToRow)
  const summaryRows = []

  for (const key of sortedKeys) {
    const { label, items } = groups[key]
    summaryRows.push({ Naam: `── ${label} ──`, Factuurnummer: '', Datum: '', 'Excl. BTW': '', 'BTW bedrag': '', 'Totaal incl. BTW': '', Status: '' })
    for (const inv of items) {
      summaryRows.push(invoiceToRow(inv))
    }
    const monthRows = items.map(invoiceToRow)
    summaryRows.push({
      Naam: 'Subtotaal',
      Factuurnummer: '',
      Datum: '',
      'Excl. BTW': +monthRows.reduce((s, r) => s + r['Excl. BTW'], 0).toFixed(2),
      'BTW bedrag': +monthRows.reduce((s, r) => s + r['BTW bedrag'], 0).toFixed(2),
      'Totaal incl. BTW': +monthRows.reduce((s, r) => s + r['Totaal incl. BTW'], 0).toFixed(2),
      Status: '',
    })
    summaryRows.push({ Naam: '', Factuurnummer: '', Datum: '', 'Excl. BTW': '', 'BTW bedrag': '', 'Totaal incl. BTW': '', Status: '' })
  }

  // Grand total row
  summaryRows.push({
    Naam: 'GRAND TOTAL',
    Factuurnummer: '',
    Datum: '',
    'Excl. BTW': +allRows.reduce((s, r) => s + r['Excl. BTW'], 0).toFixed(2),
    'BTW bedrag': +allRows.reduce((s, r) => s + r['BTW bedrag'], 0).toFixed(2),
    'Totaal incl. BTW': +allRows.reduce((s, r) => s + r['Totaal incl. BTW'], 0).toFixed(2),
    Status: '',
  })

  const summaryWs = XLSX.utils.json_to_sheet(summaryRows)
  applyColumnWidths(summaryWs, summaryRows)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Overzicht')

  const year = new Date().getFullYear()
  XLSX.writeFile(wb, `Omniworx-Facturen-${year}.xlsx`)
}

function applyColumnWidths(ws, rows) {
  const cols = [
    { wch: 28 }, // Naam
    { wch: 16 }, // Factuurnummer
    { wch: 12 }, // Datum
    { wch: 14 }, // Excl. BTW
    { wch: 14 }, // BTW bedrag
    { wch: 18 }, // Totaal incl. BTW
    { wch: 12 }, // Status
  ]
  ws['!cols'] = cols
}
