import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '../../constants/company'
import { calcBtw, formatEuro } from '../../utils/btwCalc'

const BRAND_GREEN = '#0C3C3A'
const BRAND_GOLD = '#E7B260'
const BRAND_GOLD_LIGHT = '#F0CA8A'

function formatDate(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(
    lang === 'ar' ? 'ar-NL' : lang === 'en' ? 'en-NL' : 'nl-NL',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  )
}

// Inline OW monogram SVG for the invoice (no React component dependency)
function InvoiceMonogram() {
  return (
    <svg width="72" height="72" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill={BRAND_GREEN} />
      <path d="M52 18 C29 18 15 31 15 50 C15 69 29 82 52 82 C59 82 66 80 72 76 L64 67 C60 69.5 56 71 52 71 C34 71 25 62 25 50 C25 38 34 29 52 29 C56 29 60 30.5 64 33 L72 24 C66 20 59 18 52 18 Z" fill={BRAND_GOLD} />
      <path d="M55 29 L62 58 L72 38 L82 58 L89 29 L83 29 L76 51 L69.5 36 L63.5 51 L57 29 Z" fill={BRAND_GOLD} />
    </svg>
  )
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

  const headerFlex = isRtl ? 'row-reverse' : 'row'
  const textAlign = isRtl ? 'right' : 'left'
  const textAlignEnd = isRtl ? 'left' : 'right'

  return (
    <div
      ref={ref}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: '"Open Sans", Arial, sans-serif', background: 'white', color: '#1a1a1a', maxWidth: 800 }}
      className="w-full bg-white"
    >
      {/* Gold accent stripe */}
      <div style={{ height: 6, background: BRAND_GOLD, width: '100%' }} />

      {/* Brand Header */}
      <div style={{ background: BRAND_GREEN, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: headerFlex }}>
        {/* Logo left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <InvoiceMonogram />
          <div>
            <div style={{ fontFamily: 'Poppins, Arial, sans-serif', fontSize: 26, fontWeight: 900, color: BRAND_GOLD, letterSpacing: 3 }}>
              OMNIWORX
            </div>
            <div style={{ fontFamily: 'Poppins, Arial, sans-serif', fontSize: 9, color: BRAND_GOLD_LIGHT, letterSpacing: 4, marginTop: 3, opacity: 0.8 }}>
              ONDERHOUD EN RENOVATIES
            </div>
          </div>
        </div>

        {/* Company details right */}
        <div style={{ textAlign: textAlignEnd, color: 'rgba(231,178,96,0.75)', fontSize: 12, lineHeight: 1.8 }}>
          <div style={{ color: BRAND_GOLD_LIGHT }}>{COMPANY.address}</div>
          <div style={{ color: BRAND_GOLD_LIGHT }}>{COMPANY.postalCity}</div>
          <div style={{ marginTop: 6 }}>{t('kvk')}: {COMPANY.kvk}</div>
          <div>{t('btw_id')}: {COMPANY.btwId}</div>
          <div>{t('iban')}: {COMPANY.iban}</div>
        </div>
      </div>

      {/* Invoice Meta row */}
      <div style={{ padding: '28px 40px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: headerFlex, borderBottom: `2px solid ${BRAND_GOLD}` }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 30, fontWeight: 900, color: BRAND_GREEN, margin: '0 0 12px' }}>{t('invoice_title')}</h1>
          <div style={{ fontSize: 14, lineHeight: 2, color: '#374151' }}>
            <div><strong>{t('invoice_number')}:</strong> {invoice.invoiceNumber}</div>
            <div><strong>{t('invoice_date')}:</strong> {formatDate(invoice.date, invoiceLang)}</div>
            <div><strong>{t('due_date')}:</strong> {formatDate(invoice.dueDate, invoiceLang)}</div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ textAlign: textAlignEnd }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: BRAND_GREEN, letterSpacing: 2, marginBottom: 8 }}>{t('bill_to')}</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#1f2937' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: BRAND_GREEN }}>{client.name}</div>
            {client.address && <div>{client.address}</div>}
            {(client.postalCode || client.city) && <div>{client.postalCode} {client.city}</div>}
            {client.phone && <div>{client.phone}</div>}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div style={{ padding: '24px 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: BRAND_GREEN }}>
              <th style={{ padding: '12px 10px', textAlign, fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif' }}>{t('description')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>{t('quantity')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>{t('unit_price')}</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif' }}>{t('btw_rate')}</th>
              <th style={{ padding: '12px 10px', textAlign: textAlignEnd, fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif' }}>{t('line_total')}</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item, i) => {
              const lineEx = (item.quantity || 0) * (item.unitPrice || 0)
              const lineBtw = lineEx * (item.btwRate ?? 21) / 100
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${BRAND_GOLD}44`, background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '12px 10px', color: '#1f2937' }}>{item.description}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{formatEuro(item.unitPrice || 0)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: BRAND_GREEN, fontWeight: 600 }}>{item.btwRate ?? 21}%</td>
                  <td style={{ padding: '12px 10px', textAlign: textAlignEnd, fontWeight: 600, color: BRAND_GREEN }}>{formatEuro(lineEx + lineBtw)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '0 40px 24px', display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
        <div style={{ minWidth: 300, background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: `1px solid ${BRAND_GOLD}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14, color: '#374151' }}>
            <span>{t('subtotal')}</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          {Object.entries(btwGroups).map(([rate, amount]) => amount > 0 && (
            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14, color: '#374151' }}>
              <span>{t('btw')} {rate}%</span>
              <span>{formatEuro(amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 22, fontWeight: 900, color: BRAND_GREEN, borderTop: `2px solid ${BRAND_GOLD}`, marginTop: 8, fontFamily: 'Poppins, sans-serif' }}>
            <span>{t('grand_total')}</span>
            <span>{formatEuro(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '0 40px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: BRAND_GREEN, letterSpacing: 2, marginBottom: 8 }}>{t('notes')}</div>
          <div style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: 16, borderRadius: 8, borderLeft: `3px solid ${BRAND_GOLD}` }}>{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: BRAND_GREEN, padding: '20px 40px', marginTop: 8 }}>
        <div style={{ height: 2, background: BRAND_GOLD, marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 14, color: BRAND_GOLD, marginBottom: 6, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
          {t('payment_terms', { days: dueDays })}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(231,178,96,0.75)', lineHeight: 1.6 }}>
          {t('payment_details', { iban: COMPANY.iban, name: COMPANY.name })}
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(231,178,96,0.6)', fontStyle: 'italic' }}>
          {t('thank_you')}
        </div>
      </div>
    </div>
  )
})
