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

// Clone the element to position (0,0) of the viewport so html2canvas can
// capture it. The previous approach (top: -9999px) placed the clone ABOVE
// the viewport, which html2canvas cannot capture — resulting in blank PDFs.
// z-index: -1 keeps the clone behind all page content so the user never sees it.
async function captureElement(element, filename) {
  const html2pdf = (await import('html2pdf.js')).default

  const clone = element.cloneNode(true)
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '794px',
    minWidth: '794px',
    maxWidth: '794px',
    transform: 'none',
    background: 'white',
    zIndex: '-1',
    pointerEvents: 'none',
  })
  document.body.appendChild(clone)

  const options = {
    margin: [8, 0, 8, 0],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  try {
    return await html2pdf().set(options).from(clone).outputPdf('blob')
  } finally {
    document.body.removeChild(clone)
  }
}

// Returns invoice-only PDF blob (no AV). Used for the in-app preview.
// Call mergeWithAV(blob) before sharing if AV is needed.
export async function generateInvoicePdf(element, invoiceNumber) {
  return captureElement(element, `Factuur-${invoiceNumber}.pdf`)
}

export async function generateQuotePdf(element, quoteNumber) {
  return captureElement(element, `Offerte-${quoteNumber}.pdf`)
}
