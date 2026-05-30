async function mergeWithAV(invoiceBlob) {
  const { PDFDocument } = await import('pdf-lib')

  const [invoiceBytes, avBytes] = await Promise.all([
    invoiceBlob.arrayBuffer(),
    fetch('/algemene-voorwaarden.pdf').then(r => r.arrayBuffer()),
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
}

// Clones the element to document.body so it escapes any overflow-hidden or
// transform:scale parents (like ScaledPreview), then captures at full A4 width.
async function captureElement(element, filename) {
  const html2pdf = (await import('html2pdf.js')).default

  const clone = element.cloneNode(true)
  Object.assign(clone.style, {
    position: 'fixed',
    top: '-9999px',
    left: '0',
    width: '794px',
    minWidth: '794px',
    maxWidth: '794px',
    transform: 'none',
    background: 'white',
    zIndex: '-9999',
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

export async function generateInvoicePdf(element, invoiceNumber) {
  const blob = await captureElement(element, `Factuur-${invoiceNumber}.pdf`)
  return mergeWithAV(blob)
}

export async function generateQuotePdf(element, quoteNumber) {
  const blob = await captureElement(element, `Offerte-${quoteNumber}.pdf`)
  return mergeWithAV(blob)
}
