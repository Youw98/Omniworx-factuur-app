export async function generateInvoicePdf(element, invoiceNumber) {
  const html2pdf = (await import('html2pdf.js')).default
  const options = {
    margin: [10, 10, 10, 10],
    filename: `Factuur-${invoiceNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }
  return html2pdf().set(options).from(element).outputPdf('blob')
}
