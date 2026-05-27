import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '../../constants/company'
import { calcBtw, formatEuro } from '../../utils/btwCalc'

function formatDate(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-NL' : lang === 'en' ? 'en-NL' : 'nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export const InvoicePreview = forwardRef(function InvoicePreview({ invoice }, ref) {
  const invoiceLang = invoice.invoiceLanguage || 'nl'
  const { t: tInv } = useTranslation('invoice')
  const t = (key, opts) => tInv(key, { lng: invoiceLang, ...opts })

  const isRtl = invoiceLang === 'ar'
  const { subtotal, btwGroups, btwTotal, grandTotal } = calcBtw(invoice.lineItems || [])
  const client = invoice.client || {}
  const dueDays = (() => {
    if (!invoice.date || !invoice.dueDate) return 14
    const ms = new Date(invoice.dueDate) - new Date(invoice.date)
    return Math.round(ms / (1000 * 60 * 60 * 24))
  })()

  return (
    <div
      ref={ref}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Arial, sans-serif', background: 'white', color: '#1a1a1a' }}
      className="w-full max-w-[800px] mx-auto bg-white"
    >
      {/* Header */}
      <div style={{ background: '#1e40af', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
            OMNIWORX
          </div>
          <div style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
            {COMPANY.address}<br />
            {COMPANY.postalCity}
          </div>
        </div>
        <div style={{ textAlign: isRtl ? 'left' : 'right', color: '#bfdbfe', fontSize: 13, lineHeight: 1.8 }}>
          <div>{t('kvk')}: {COMPANY.kvk}</div>
          <div>{t('btw_id')}: {COMPANY.btwId}</div>
          <div>{t('iban')}: {COMPANY.iban}</div>
        </div>
      </div>

      {/* Invoice Title + Meta */}
      <div style={{ padding: '32px 40px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1e40af', margin: 0 }}>{t('invoice_title')}</h1>
          <div style={{ marginTop: 16, fontSize: 15, lineHeight: 2 }}>
            <div><strong>{t('invoice_number')}:</strong> {invoice.invoiceNumber}</div>
            <div><strong>{t('invoice_date')}:</strong> {formatDate(invoice.date, invoiceLang)}</div>
            <div><strong>{t('due_date')}:</strong> {formatDate(invoice.dueDate, invoiceLang)}</div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: 1 }}>{t('bill_to')}</div>
          <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{client.name}</div>
            {client.address && <div>{client.address}</div>}
            {(client.postalCode || client.city) && <div>{client.postalCode} {client.city}</div>}
            {client.phone && <div>{client.phone}</div>}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: '#1e40af', margin: '0 40px' }} />

      {/* Line Items Table */}
      <div style={{ padding: '24px 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '12px 8px', textAlign: isRtl ? 'right' : 'left', fontWeight: 700, color: '#374151' }}>{t('description')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{t('quantity')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{t('unit_price')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#374151' }}>{t('btw_rate')}</th>
              <th style={{ padding: '12px 8px', textAlign: isRtl ? 'left' : 'right', fontWeight: 700, color: '#374151' }}>{t('line_total')}</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item, i) => {
              const lineEx = (item.quantity || 0) * (item.unitPrice || 0)
              const lineBtw = lineEx * (item.btwRate ?? 21) / 100
              return (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 8px', color: '#1f2937' }}>{item.description}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{formatEuro(item.unitPrice || 0)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.btwRate ?? 21}%</td>
                  <td style={{ padding: '12px 8px', textAlign: isRtl ? 'left' : 'right', fontWeight: 600 }}>{formatEuro(lineEx + lineBtw)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '0 40px 24px', display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
        <div style={{ minWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 15, color: '#374151' }}>
            <span>{t('subtotal')}</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          {Object.entries(btwGroups).map(([rate, amount]) => amount > 0 && (
            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 15, color: '#374151' }}>
              <span>{t('btw')} {rate}%</span>
              <span>{formatEuro(amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 20, fontWeight: 900, color: '#1e40af', borderTop: '2px solid #1e40af', marginTop: 6 }}>
            <span>{t('grand_total')}</span>
            <span>{formatEuro(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '0 40px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>{t('notes')}</div>
          <div style={{ fontSize: 14, color: '#374151', background: '#f9fafb', padding: 16, borderRadius: 8 }}>{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: '#f1f5f9', padding: '20px 40px', borderTop: '2px solid #e5e7eb' }}>
        <div style={{ fontSize: 14, color: '#374151', marginBottom: 6, fontWeight: 600 }}>
          {t('payment_terms', { days: dueDays })}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {t('payment_details', { iban: COMPANY.iban, name: COMPANY.name })}
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: '#374151', fontStyle: 'italic' }}>
          {t('thank_you')}
        </div>
      </div>
    </div>
  )
})
