export async function generateInvoicePdf(element, invoiceNumber) {
  const html2pdf = (await import('html2pdf.js')).default
  // Set element to A4 width so PDF captures the full invoice layout
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
    return await html2pdf().set(options).from(element).outputPdf('blob')
  } finally {
    element.style.width = prevWidth
    element.style.minWidth = prevMinWidth
  }
}
