export async function shareInvoicePdf(pdfBlob, invoiceNumber) {
  const filename = `Factuur-${invoiceNumber}.pdf`
  const file = new File([pdfBlob], filename, { type: 'application/pdf' })

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Factuur ${invoiceNumber}`,
        text: `Factuur ${invoiceNumber} van Omniworx`,
        files: [file],
      })
      return true
    } catch (e) {
      // AbortError = user dismissed the share sheet — not a failure
      if (e.name === 'AbortError') return true
      // Any other error → fall through to download
    }
  }

  // Fallback: trigger browser download
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return false
}
