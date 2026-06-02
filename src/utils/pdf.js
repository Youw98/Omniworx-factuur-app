import { COMPANY } from '../constants/company'
import { SERVICES, UNITS } from '../constants/services'
import { calcBtw, formatEuro } from './btwCalc'

// Merge an invoice/quote PDF blob with the algemene-voorwaarden PDF.
// Used when SHARING — not for the in-app preview.
export async function mergeWithAV(invoiceBlob) {
  try {
    const { PDFDocument } = await import('pdf-lib')

    const avResponse = await fetch('/algemene-voorwaarden.pdf')
    if (!avResponse.ok) return invoiceBlob

    const [invoiceBytes, avBytes] = await Promise.all([
      invoiceBlob.arrayBuffer(),
      avResponse.arrayBuffer(),
    ])

    const merged = await PDFDocument.create()
    const [invoiceDoc, avDoc] = await Promise.all([
      PDFDocument.load(invoiceBytes),
      PDFDocument.load(avBytes),
    ])

    const invoicePages = await merged.copyPages(invoiceDoc, invoiceDoc.getPageIndices())
    invoicePages.forEach(p => merged.addPage(p))

    const avPages = await merged.copyPages(avDoc, avDoc.getPageIndices())
    avPages.forEach(p => merged.addPage(p))

    const mergedBytes = await merged.save()
    return new Blob([mergedBytes], { type: 'application/pdf' })
  } catch {
    return invoiceBlob
  }
}

function fmtDate(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(
    lang === 'ar' ? 'ar-NL' : lang === 'en' ? 'en-GB' : 'nl-NL',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  )
}

function serviceLabel(item, lang) {
  // Arabic text can't render in jsPDF without embedded font — fall back to English
  const l = lang === 'ar' ? 'en' : lang
  if (item.serviceId && item.serviceId !== 'other') {
    const svc = SERVICES.find(s => s.id === item.serviceId)
    if (svc) return svc[l] || svc.en || svc.nl
  }
  return item.description || ''
}

function unitLabel(unit, lang) {
  const l = lang === 'ar' ? 'en' : lang
  const u = UNITS.find(x => x.value === unit)
  return u ? (u[l] || u.nl) : (unit || '')
}

// Fetch logo → canvas → PNG base64 (cross-format safe for jsPDF)
async function loadLogo() {
  try {
    const resp = await fetch('/logo-stacked.webp')
    if (!resp.ok) return null
    const blob = await resp.blob()
    const img = new Image()
    const objUrl = URL.createObjectURL(blob)
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = objUrl })
    URL.revokeObjectURL(objUrl)
    const cv = document.createElement('canvas')
    cv.width = img.naturalWidth; cv.height = img.naturalHeight
    cv.getContext('2d').drawImage(img, 0, 0)
    return cv.toDataURL('image/png')
  } catch {
    return null
  }
}

// Hardcoded labels for all three languages (no React dependency in PDF util)
// Arabic uses English labels since jsPDF built-in fonts don't render Arabic glyphs
const L = {
  nl: {
    invoice: {
      title: 'FACTUUR', num: 'Factuurnummer', date: 'Factuurdatum',
      due: 'Vervaldatum', billTo: 'Factuur aan',
      desc: 'Omschrijving', qty: 'Aantal', price: 'Prijs/stuk', btw: 'BTW%', total: 'Totaal',
      subtotal: 'Subtotaal', btwLabel: 'BTW', grandTotal: 'Totaal', notes: 'Opmerkingen',
      footer1: (d) => `Betaling vóór ${d} op IBAN ${COMPANY.iban}`,
      footer2: `t.n.v. ${COMPANY.name} · KVK ${COMPANY.kvk} · BTW ${COMPANY.btwId}`,
      thanks: 'Hartelijk dank voor uw opdracht.',
    },
    quote: {
      title: 'OFFERTE', num: 'Offertenummer', date: 'Offertedatum',
      due: 'Geldig tot', billTo: 'Offerte voor',
      desc: 'Omschrijving', qty: 'Aantal', price: 'Prijs/stuk', btw: 'BTW%', total: 'Totaal',
      subtotal: 'Subtotaal', btwLabel: 'BTW', grandTotal: 'Totaal', notes: 'Opmerkingen',
      footer1: (d) => `Deze offerte is geldig tot ${d}`,
      footer2: `Vragen? ${COMPANY.name} · IBAN ${COMPANY.iban}`,
      thanks: 'Wij kijken uit naar uw reactie.',
    },
  },
  en: {
    invoice: {
      title: 'INVOICE', num: 'Invoice Number', date: 'Invoice Date',
      due: 'Due Date', billTo: 'Bill To',
      desc: 'Description', qty: 'Qty', price: 'Unit Price', btw: 'VAT%', total: 'Total',
      subtotal: 'Subtotal', btwLabel: 'VAT', grandTotal: 'Total', notes: 'Notes',
      footer1: (d) => `Payment due ${d} to IBAN ${COMPANY.iban}`,
      footer2: `in the name of ${COMPANY.name} · KVK ${COMPANY.kvk}`,
      thanks: 'Thank you for your business.',
    },
    quote: {
      title: 'QUOTATION', num: 'Quote Number', date: 'Quote Date',
      due: 'Valid Until', billTo: 'Quote For',
      desc: 'Description', qty: 'Qty', price: 'Unit Price', btw: 'VAT%', total: 'Total',
      subtotal: 'Subtotal', btwLabel: 'VAT', grandTotal: 'Total', notes: 'Notes',
      footer1: (d) => `This quotation is valid until ${d}`,
      footer2: `Questions? ${COMPANY.name} · IBAN ${COMPANY.iban}`,
      thanks: 'We look forward to your response.',
    },
  },
}
// Arabic falls back to English labels
L.ar = L.en

const GREEN = [12, 60, 58]
const GOLD = [231, 178, 96]
const GOLD_LIGHT = [240, 202, 138]
const GOLD_DIM = [180, 140, 80]

async function buildPdf(type, data, filename) {
  const { jsPDF } = await import('jspdf')

  const lang = data.invoiceLanguage || 'nl'
  const lbl = (L[lang] || L.nl)[type]
  const items = data.lineItems || []
  const client = data.client || data.clientSnapshot || {}
  const docNum = type === 'invoice' ? data.invoiceNumber : data.quoteNumber
  const dueIso = type === 'invoice' ? data.dueDate : data.validUntil
  const dueStr = fmtDate(dueIso, lang)

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210
  const M = 14          // page margin
  const CW = W - 2 * M  // 182 mm content width

  const logo = await loadLogo()

  let y = 0

  // ── Gold top stripe ──────────────────────────────────────────────
  doc.setFillColor(...GOLD)
  doc.rect(0, 0, W, 2, 'F')
  y = 2

  // ── Green header band ────────────────────────────────────────────
  doc.setFillColor(...GREEN)
  doc.rect(0, y, W, 31, 'F')

  if (logo) {
    doc.addImage(logo, 'PNG', M, y + 4, 22, 22)
  }

  doc.setFontSize(9.5).setFont('helvetica', 'bold').setTextColor(...GOLD_LIGHT)
  doc.text(COMPANY.name, W - M, y + 9, { align: 'right' })
  doc.setFontSize(8.5).setFont('helvetica', 'normal')
  doc.text(COMPANY.address, W - M, y + 15, { align: 'right' })
  doc.text(COMPANY.postalCity, W - M, y + 20, { align: 'right' })
  doc.setTextColor(...GOLD_DIM).setFontSize(7.5)
  doc.text(`KVK: ${COMPANY.kvk}`, W - M, y + 26, { align: 'right' })
  doc.text(`BTW: ${COMPANY.btwId}`, W - M, y + 30, { align: 'right' })

  y += 31

  // ── Gold divider ─────────────────────────────────────────────────
  doc.setFillColor(...GOLD).rect(0, y, W, 1, 'F')
  y += 1

  // ── Meta: title + fields + bill-to card ──────────────────────────
  const META_Y = y + 7

  // Title
  doc.setFontSize(20).setFont('helvetica', 'bold').setTextColor(...GREEN)
  doc.text(lbl.title, M, META_Y + 8)

  // Number / Date / Due
  const metaRows = [
    { label: lbl.num,  value: `#${docNum}` },
    { label: lbl.date, value: fmtDate(data.date, lang) },
    { label: lbl.due,  value: dueStr, amber: true },
  ]
  metaRows.forEach(({ label, value, amber }, i) => {
    const ry = META_Y + 17 + i * 6.5
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(107, 114, 128)
    doc.text(`${label}:`, M, ry)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(amber ? 180 : 31, amber ? 83 : 41, amber ? 9 : 55)
    doc.text(value, M + 40, ry)
  })

  // Bill-to card
  const CARD_W = 74, CARD_H = 40, CARD_X = W - M - CARD_W, CARD_Y = META_Y - 1
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(...GOLD).setLineWidth(0.3)
  doc.roundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 3, 3, 'FD')

  doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(...GOLD)
  doc.text(lbl.billTo.toUpperCase(), CARD_X + CARD_W - 5, CARD_Y + 7, { align: 'right' })

  doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(...GREEN)
  const cName = (client.name || '').substring(0, 30)
  doc.text(cName, CARD_X + CARD_W - 5, CARD_Y + 14, { align: 'right' })

  doc.setFontSize(8.5).setFont('helvetica', 'normal').setTextColor(75, 85, 99)
  let cy = CARD_Y + 20
  if (client.address) { doc.text(client.address.substring(0, 28), CARD_X + CARD_W - 5, cy, { align: 'right' }); cy += 5 }
  const pc = [client.postalCode, client.city].filter(Boolean).join(' ')
  if (pc) { doc.text(pc.substring(0, 28), CARD_X + CARD_W - 5, cy, { align: 'right' }); cy += 5 }
  if (client.phone) { doc.setTextColor(107, 114, 128); doc.text(client.phone, CARD_X + CARD_W - 5, cy, { align: 'right' }) }

  y = META_Y + 44

  // ── Section divider ───────────────────────────────────────────────
  doc.setDrawColor(...GOLD).setLineWidth(0.3).line(M, y, W - M, y)
  y += 5

  // ── Table ─────────────────────────────────────────────────────────
  // Column widths (total = CW = 182)
  const COL = [74, 27, 31, 16, 34]
  const HDR_H = 8, ROW_H = 7.5

  // Header
  doc.setFillColor(...GREEN).rect(M, y, CW, HDR_H, 'F')
  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(...GOLD)
  const headers = [lbl.desc, lbl.qty, lbl.price, lbl.btw, lbl.total]
  let cx = M
  headers.forEach((h, i) => {
    const last = i === headers.length - 1
    const tx = i === 0 ? cx + 3 : last ? cx + COL[i] - 3 : cx + COL[i] / 2
    doc.text(h, tx, y + 5.5, { align: i === 0 ? 'left' : last ? 'right' : 'center' })
    cx += COL[i]
  })
  y += HDR_H

  // Rows
  items.forEach((item, idx) => {
    if (y + ROW_H > 260) { doc.addPage(); y = 15 }

    const exVat = (item.quantity || 0) * (item.unitPrice || 0)
    const vat = exVat * (item.btwRate ?? 21) / 100
    const desc = serviceLabel(item, lang)
    const qty = `${item.quantity || ''}${item.unit ? ' ' + unitLabel(item.unit, lang) : ''}`

    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251)
    doc.rect(M, y, CW, ROW_H, 'F')
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]).setLineWidth(0.15)
    doc.line(M, y + ROW_H, M + CW, y + ROW_H)

    doc.setFontSize(8.5)
    cx = M
    const cells = [
      { v: desc.substring(0, 36), a: 'left', color: [55, 65, 81] },
      { v: qty, a: 'center', color: [55, 65, 81] },
      { v: formatEuro(item.unitPrice || 0), a: 'center', color: [55, 65, 81] },
      { v: `${item.btwRate ?? 21}%`, a: 'center', color: GREEN, bold: true },
      { v: formatEuro(exVat + vat), a: 'right', color: GREEN, bold: true },
    ]
    cells.forEach((cell, i) => {
      const tx = cell.a === 'left' ? cx + 3 : cell.a === 'right' ? cx + COL[i] - 3 : cx + COL[i] / 2
      doc.setTextColor(...cell.color).setFont('helvetica', cell.bold ? 'bold' : 'normal')
      doc.text(cell.v, tx, y + 5, { align: cell.a })
      cx += COL[i]
    })
    y += ROW_H
  })

  y += 8

  // ── Totals ─────────────────────────────────────────────────────────
  const { subtotal, btwGroups, grandTotal } = calcBtw(items)
  const btwRows = Object.entries(btwGroups).filter(([, v]) => v > 0)
  const TOT_W = 84, TOT_X = W - M - TOT_W
  const INNER_H = 8 + btwRows.length * 6.5
  const GRAND_H = 11
  const TOT_H = INNER_H + GRAND_H + 2

  if (y + TOT_H + 38 > 278) { doc.addPage(); y = 15 }

  doc.setFillColor(248, 250, 252).setDrawColor(...GOLD).setLineWidth(0.3)
  doc.roundedRect(TOT_X, y, TOT_W, TOT_H, 3, 3, 'FD')

  let ty = y + 8
  doc.setFontSize(9).setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128).text(lbl.subtotal, TOT_X + 5, ty)
  doc.setTextColor(31, 41, 55).text(formatEuro(subtotal), TOT_X + TOT_W - 5, ty, { align: 'right' })
  ty += 6.5

  btwRows.forEach(([rate, amount]) => {
    doc.setTextColor(107, 114, 128).text(`${lbl.btwLabel} ${rate}%`, TOT_X + 5, ty)
    doc.setTextColor(31, 41, 55).text(formatEuro(amount), TOT_X + TOT_W - 5, ty, { align: 'right' })
    ty += 6.5
  })

  // Grand total bar — plain rect (no rounded bottom) to sit inside rounded box
  doc.setFillColor(...GREEN).rect(TOT_X, ty, TOT_W, GRAND_H, 'F')
  doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(...GOLD)
  doc.text(lbl.grandTotal, TOT_X + 5, ty + 7.5)
  doc.text(formatEuro(grandTotal), TOT_X + TOT_W - 5, ty + 7.5, { align: 'right' })

  y += TOT_H + 8

  // ── Notes ─────────────────────────────────────────────────────────
  if (data.notes) {
    if (y + 28 > 258) { doc.addPage(); y = 15 }
    doc.setFontSize(8.5).setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(data.notes, CW - 10)
    const NOTE_H = 9 + noteLines.length * 5
    doc.setFillColor(254, 252, 232).setDrawColor(...GOLD).setLineWidth(0.3)
    doc.roundedRect(M, y, CW, NOTE_H, 3, 3, 'FD')
    doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(...GREEN)
    doc.text(lbl.notes.toUpperCase(), M + 5, y + 6)
    doc.setFontSize(8.5).setFont('helvetica', 'normal').setTextColor(55, 65, 81)
    doc.text(noteLines, M + 5, y + 12)
    y += NOTE_H + 8
  }

  // ── Footer (anchored near page bottom) ───────────────────────────
  const FOOTER_H = 28
  const FOOTER_Y = Math.max(y + 5, 297 - FOOTER_H - 2)

  doc.setFillColor(...GREEN).rect(0, FOOTER_Y, W, FOOTER_H + 4, 'F')
  doc.setFillColor(...GOLD).rect(M, FOOTER_Y + 4, CW, 0.4, 'F')

  doc.setFontSize(8.5).setFont('helvetica', 'bold').setTextColor(...GOLD_LIGHT)
  doc.text(lbl.footer1(dueStr), M, FOOTER_Y + 12)
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GOLD_LIGHT)
  doc.text(lbl.footer2, M, FOOTER_Y + 18)
  doc.setFontSize(7.5).setFont('helvetica', 'italic').setTextColor(...GOLD_DIM)
  doc.text(lbl.thanks, M, FOOTER_Y + 25)

  doc.setProperties({ title: filename })
  return doc.output('blob')
}

// Returns { blob } — no previewDataUrl (native PDF needs no DOM capture)
export async function generateInvoicePdf(invoice) {
  const blob = await buildPdf('invoice', invoice, `Factuur-${invoice.invoiceNumber}.pdf`)
  return { blob }
}

export async function generateQuotePdf(quote) {
  const blob = await buildPdf('quote', quote, `Offerte-${quote.quoteNumber}.pdf`)
  return { blob }
}
