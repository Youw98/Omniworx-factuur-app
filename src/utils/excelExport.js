import ExcelJS from 'exceljs'
import { calcBtw } from './btwCalc'

const NL_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

const COLS = [
  { header: 'Naam',              key: 'naam',    width: 28 },
  { header: 'Factuurnummer',     key: 'nummer',  width: 16 },
  { header: 'Datum',             key: 'datum',   width: 12 },
  { header: 'Excl. BTW',        key: 'excl',    width: 14 },
  { header: 'BTW bedrag',       key: 'btw',     width: 14 },
  { header: 'Totaal incl. BTW', key: 'totaal',  width: 18 },
  { header: 'Status',            key: 'status',  width: 12 },
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
    naam:   inv.client?.name || '',
    nummer: inv.invoiceNumber,
    datum:  inv.date,
    excl:   +subtotal.toFixed(2),
    btw:    +btwTotal.toFixed(2),
    totaal: +grandTotal.toFixed(2),
    status: inv.status,
  }
}

function addSheet(wb, name, rows, totalsRow) {
  const ws = wb.addWorksheet(name.substring(0, 31))
  ws.columns = COLS
  ws.getRow(1).font = { bold: true }
  rows.forEach(r => ws.addRow(r))
  if (totalsRow) {
    const tr = ws.addRow(totalsRow)
    tr.font = { bold: true }
  }
  return ws
}

function sumRows(rows, key) {
  return +rows.reduce((s, r) => s + (r[key] || 0), 0).toFixed(2)
}

export async function exportInvoicesToExcel(invoices) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Omniworx Factuur'
  wb.created = new Date()

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
    const totalsRow = { naam: 'TOTAAL', nummer: '', datum: '', excl: sumRows(rows, 'excl'), btw: sumRows(rows, 'btw'), totaal: sumRows(rows, 'totaal'), status: '' }
    addSheet(wb, label, rows, totalsRow)
  }

  // Summary sheet
  const summaryWs = wb.addWorksheet('Overzicht')
  summaryWs.columns = COLS
  summaryWs.getRow(1).font = { bold: true }

  const allRows = []
  for (const key of sortedKeys) {
    const { label, items } = groups[key]
    const monthRows = items.map(invoiceToRow)
    summaryWs.addRow({ naam: `── ${label} ──` }).font = { italic: true }
    monthRows.forEach(r => { summaryWs.addRow(r); allRows.push(r) })
    const sub = summaryWs.addRow({ naam: 'Subtotaal', excl: sumRows(monthRows, 'excl'), btw: sumRows(monthRows, 'btw'), totaal: sumRows(monthRows, 'totaal') })
    sub.font = { bold: true }
    summaryWs.addRow({})
  }
  const grand = summaryWs.addRow({ naam: 'GRAND TOTAL', excl: sumRows(allRows, 'excl'), btw: sumRows(allRows, 'btw'), totaal: sumRows(allRows, 'totaal') })
  grand.font = { bold: true }

  // Download in browser
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Omniworx-Facturen-${new Date().getFullYear()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
