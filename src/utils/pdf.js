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

// html2canvas clips to the viewport: elements outside it produce a blank canvas.
// We clone the element to (0,0) in the viewport and hide it with a white overlay.
// We bypass html2pdf because its bundled (older) html2canvas silently produces
// blank output; we import html2canvas v1.4.1 and jsPDF directly instead.
async function captureElement(element, filename) {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf'),
  ])

  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'white',
    zIndex: '99999', pointerEvents: 'none',
  })
  document.body.appendChild(overlay)

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
    zIndex: '99998',
    pointerEvents: 'none',
  })
  document.body.appendChild(clone)

  // overflow-x:hidden on <html>/<body> clips the 794px clone on a 390px mobile
  // viewport — temporarily allow overflow so html2canvas sees the full width
  const htmlEl = document.documentElement
  const bodyEl = document.body
  const prevHtmlOX = htmlEl.style.overflowX
  const prevBodyOX = bodyEl.style.overflowX
  htmlEl.style.overflowX = 'visible'
  bodyEl.style.overflowX = 'visible'

  // Wait for fonts + layout (important on slower/newer Android devices)
  await document.fonts.ready
  await new Promise(r => setTimeout(r, 500))

  try {
    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 794,
      height: clone.scrollHeight,
      windowWidth: 794,
      windowHeight: clone.scrollHeight,
      foreignObjectRendering: false,
      imageTimeout: 15000,
      backgroundColor: '#ffffff',
    })

    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.88)

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 8
    const printW = pageW - margin * 2
    const printH = pageH - margin * 2

    const imgW = canvas.width
    const imgH = canvas.height
    const ratio = imgW / imgH

    const totalMmH = printW / ratio

    let yOffset = 0
    let page = 0
    while (yOffset < totalMmH) {
      if (page > 0) pdf.addPage()
      // Source slice in canvas pixels
      const sliceMmH = Math.min(printH, totalMmH - yOffset)
      const slicePxH = (sliceMmH / totalMmH) * imgH
      const srcY = (yOffset / totalMmH) * imgH

      // Crop to the slice via a temp canvas
      const slice = document.createElement('canvas')
      slice.width = imgW
      slice.height = Math.ceil(slicePxH)
      slice.getContext('2d').drawImage(canvas, 0, srcY, imgW, Math.ceil(slicePxH), 0, 0, imgW, Math.ceil(slicePxH))

      pdf.addImage(slice.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, printW, sliceMmH)
      yOffset += printH
      page++
    }

    pdf.setProperties({ title: filename })
    const blob = pdf.output('blob')
    return { blob, previewDataUrl }
  } finally {
    htmlEl.style.overflowX = prevHtmlOX
    bodyEl.style.overflowX = prevBodyOX
    document.body.removeChild(clone)
    document.body.removeChild(overlay)
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
