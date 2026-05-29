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

export async function generateInvoicePdf(element, invoiceNumber) {
  const html2pdf = (await import('html2pdf.js')).default
  const prevWidth = element.style.width
  const prevMinWidth = element.style.minWidth
  element.style.width = '794px'
  element.style.minWidth = '794px'
  const options = {
    margin: [10, 10, 10, 10],
    filename: `Factuur-${invoiceNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }
  try {
    const invoiceBlob = await html2pdf().set(options).from(element).outputPdf('blob')
    return await mergeWithAV(invoiceBlob)
  } finally {
    element.style.width = prevWidth
    element.style.minWidth = prevMinWidth
  }
}

export async function generateQuotePdf(element, quoteNumber) {
  const html2pdf = (await import('html2pdf.js')).default
  const prevWidth = element.style.width
  const prevMinWidth = element.style.minWidth
  element.style.width = '794px'
  element.style.minWidth = '794px'
  const options = {
    margin: [10, 10, 10, 10],
    filename: `Offerte-${quoteNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }
  try {
    const quoteBlob = await html2pdf().set(options).from(element).outputPdf('blob')
    return await mergeWithAV(quoteBlob)
  } finally {
    element.style.width = prevWidth
    element.style.minWidth = prevMinWidth
  }
}
