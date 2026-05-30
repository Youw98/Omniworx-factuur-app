import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '../../constants/company'
import { SERVICES, UNITS } from '../../constants/services'
import { calcBtw, formatEuro } from '../../utils/btwCalc'

const BRAND_GREEN = '#0C3C3A'
const BRAND_GOLD = '#E7B260'
const BRAND_GOLD_LIGHT = '#F0CA8A'

function formatDate(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(
    lang === 'ar' ? 'ar-NL' : lang === 'en' ? 'en-GB' : 'nl-NL',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  )
}

function getServiceLabel(item, lang) {
  if (item.serviceId && item.serviceId !== 'other') {
    const svc = SERVICES.find(s => s.id === item.serviceId)
    if (svc) return svc[lang] || svc.en || svc.nl
  }
  return item.description || ''
}

function getUnitLabel(unit, lang) {
  const u = UNITS.find(x => x.value === unit)
  return u ? (u[lang] || u.nl) : (unit || '')
}


export const InvoicePreview = forwardRef(function InvoicePreview({ invoice }, ref) {
  const invoiceLang = invoice.invoiceLanguage || 'nl'
  const { t: tInv } = useTranslation('invoice')
  const t = (key, opts) => tInv(key, { lng: invoiceLang, ...opts })

  const isRtl = invoiceLang === 'ar'
  const isPaid = invoice.status === 'paid'
  const { subtotal, btwGroups, grandTotal } = calcBtw(invoice.lineItems || [])
  const client = invoice.client || {}
  const dueDays = (() => {
    if (!invoice.date || !invoice.dueDate) return 14
    const ms = new Date(invoice.dueDate) - new Date(invoice.date)
    return Math.round(ms / (1000 * 60 * 60 * 24))
  })()

  const dir = isRtl ? 'rtl' : 'ltr'
  const textAlign = isRtl ? 'right' : 'left'
  const textAlignEnd = isRtl ? 'left' : 'right'
  const flexDir = isRtl ? 'row-reverse' : 'row'
  const bodyFont = isRtl
    ? '"Noto Sans Arabic", "Cairo", Arial, sans-serif'
    : '"Open Sans", Arial, sans-serif'

  // "PAID" watermark label in invoice language
  const paidLabel = invoiceLang === 'ar' ? 'مدفوعة' : invoiceLang === 'en' ? 'PAID' : 'BETAALD'

  return (
    <div
      ref={ref}
      dir={dir}
      style={{
        fontFamily: bodyFont,
        background: 'white',
        color: '#1a1a1a',
        maxWidth: 800,
        position: 'relative',
      }}
      className="w-full bg-white"
    >
      {/* Diagonal paid watermark */}
      {isPaid && (
        <div style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-28deg)',
          fontSize: 80,
          fontWeight: 900,
          color: '#16a34a',
          opacity: 0.07,
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: 6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          zIndex: 1,
        }}>
          {paidLabel}
        </div>
      )}

      {/* Top gold stripe */}
      <div style={{ height: 6, background: BRAND_GOLD, width: '100%' }} />

      {/* Brand header */}
      <div style={{
        background: BRAND_GREEN,
        padding: '28px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: flexDir,
      }}>
        {/* Logo */}
        <img
          src="/logo-stacked.webp"
          alt="Omniworx"
          style={{ height: 110, width: 'auto', display: 'block' }}
        />

        {/* Company details */}
        <div style={{ textAlign: textAlignEnd, fontSize: 12, lineHeight: 1.9 }}>
          <div style={{ color: BRAND_GOLD_LIGHT, fontWeight: 600 }}>{COMPANY.address}</div>
          <div style={{ color: BRAND_GOLD_LIGHT, fontWeight: 600 }}>{COMPANY.postalCity}</div>
          <div style={{ color: 'rgba(231,178,96,0.65)', marginTop: 6 }}>{t('kvk')}: {COMPANY.kvk}</div>
          <div style={{ color: 'rgba(231,178,96,0.65)' }}>{t('btw_id')}: {COMPANY.btwId}</div>
          <div style={{ color: BRAND_GOLD, fontWeight: 700, marginTop: 4 }}>{t('iban')}: {COMPANY.iban}</div>
        </div>
      </div>

      {/* Gold divider stripe under header */}
      <div style={{ height: 3, background: `linear-gradient(${isRtl ? '270deg' : '90deg'}, ${BRAND_GOLD}, ${BRAND_GOLD}88)` }} />

      {/* Invoice meta + Bill-to */}
      <div style={{
        padding: '32px 40px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: flexDir,
        gap: 24,
        borderBottom: `2px solid ${BRAND_GOLD}33`,
      }}>
        {/* Left: FACTUUR + number + dates */}
        <div>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 32,
            fontWeight: 900,
            color: BRAND_GREEN,
            margin: '0 0 4px',
            letterSpacing: 1,
          }}>
            {t('invoice_title')}
          </h1>
          {/* Invoice number badge */}
          <div style={{
            display: 'inline-block',
            background: BRAND_GREEN,
            color: BRAND_GOLD,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: 15,
            padding: '4px 14px',
            borderRadius: 20,
            marginBottom: 14,
            letterSpacing: 1,
          }}>
            #{invoice.invoiceNumber}
          </div>
          <div style={{ fontSize: 13, lineHeight: 2.1, color: '#374151' }}>
            <div>
              <span style={{ color: '#6b7280', marginRight: 6 }}>{t('invoice_date')}:</span>
              <strong>{formatDate(invoice.date, invoiceLang)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280', marginRight: 6 }}>{t('due_date')}:</span>
              <strong style={{ color: grandTotal > 0 && !isPaid ? '#b45309' : '#374151' }}>
                {formatDate(invoice.dueDate, invoiceLang)}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Bill-to card */}
        <div style={{
          textAlign: textAlignEnd,
          background: '#f8fafc',
          border: `1px solid ${BRAND_GOLD}44`,
          borderRadius: 10,
          padding: '16px 20px',
          minWidth: 200,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: BRAND_GOLD,
            letterSpacing: 3,
            marginBottom: 10,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {t('bill_to')}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: '#1f2937' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: BRAND_GREEN, marginBottom: 2 }}>{client.name}</div>
            {client.address && <div style={{ color: '#4b5563' }}>{client.address}</div>}
            {(client.postalCode || client.city) && (
              <div style={{ color: '#4b5563' }}>{client.postalCode} {client.city}</div>
            )}
            {client.phone && <div style={{ color: '#6b7280', marginTop: 4 }}>{client.phone}</div>}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div style={{ padding: '20px 40px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{
                padding: '11px 12px',
                textAlign,
                fontWeight: 700,
                color: BRAND_GOLD,
                fontFamily: 'Poppins, sans-serif',
                background: BRAND_GREEN,
                fontSize: 12,
                letterSpacing: 0.5,
              }}>
                {t('description')}
              </th>
              <th style={{ padding: '11px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 12, whiteSpace: 'nowrap' }}>
                {t('quantity')}
              </th>
              <th style={{ padding: '11px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 12, whiteSpace: 'nowrap' }}>
                {t('unit_price')}
              </th>
              <th style={{ padding: '11px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 12 }}>
                {t('btw_rate')}
              </th>
              <th style={{ padding: '11px 12px', textAlign: textAlignEnd, fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 12 }}>
                {t('line_total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item, i) => {
              const lineEx = (item.quantity || 0) * (item.unitPrice || 0)
              const lineBtw = lineEx * (item.btwRate ?? 21) / 100
              const desc = getServiceLabel(item, invoiceLang)
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid ${BRAND_GOLD}33`,
                    background: i % 2 === 0 ? '#ffffff' : '#fafbfc',
                  }}
                >
                  <td style={{ padding: '13px 12px', color: '#1f2937', fontWeight: 500 }}>{desc}</td>
                  <td style={{ padding: '13px 8px', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>
                    {item.quantity}{item.unit ? ` ${getUnitLabel(item.unit, invoiceLang)}` : ''}
                  </td>
                  <td style={{ padding: '13px 8px', textAlign: 'center', color: '#374151' }}>{formatEuro(item.unitPrice || 0)}</td>
                  <td style={{ padding: '13px 8px', textAlign: 'center', color: BRAND_GREEN, fontWeight: 600, fontSize: 12 }}>
                    {item.btwRate ?? 21}%
                  </td>
                  <td style={{ padding: '13px 12px', textAlign: textAlignEnd, fontWeight: 700, color: BRAND_GREEN }}>
                    {formatEuro(lineEx + lineBtw)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '12px 40px 28px', display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
        <div style={{
          minWidth: 280,
          background: '#f8fafc',
          borderRadius: 10,
          padding: '16px 20px',
          border: `1px solid ${BRAND_GOLD}44`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#374151' }}>
            <span>{t('subtotal')}</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          {Object.entries(btwGroups).map(([rate, amount]) => amount > 0 && (
            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#374151' }}>
              <span>{t('btw')} {rate}%</span>
              <span>{formatEuro(amount)}</span>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 20,
            fontWeight: 900,
            color: 'white',
            background: BRAND_GREEN,
            margin: '10px -20px -16px',
            padding: '12px 20px',
            borderRadius: '0 0 10px 10px',
            fontFamily: 'Poppins, sans-serif',
          }}>
            <span>{t('grand_total')}</span>
            <span style={{ color: BRAND_GOLD }}>{formatEuro(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '0 40px 24px' }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: BRAND_GREEN,
            letterSpacing: 2,
            marginBottom: 8,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {t('notes')}
          </div>
          <div style={{
            fontSize: 13,
            color: '#374151',
            background: '#fefce8',
            padding: '12px 16px',
            borderRadius: 8,
            borderLeft: `3px solid ${BRAND_GOLD}`,
            lineHeight: 1.6,
          }}>
            {invoice.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: BRAND_GREEN, padding: '18px 40px 22px', marginTop: 4 }}>
        <div style={{ height: 2, background: BRAND_GOLD, marginBottom: 14, opacity: 0.4 }} />
        <div style={{
          fontSize: 14,
          color: BRAND_GOLD,
          marginBottom: 5,
          fontWeight: 700,
          fontFamily: 'Poppins, sans-serif',
        }}>
          {t('payment_terms', { days: dueDays })}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(231,178,96,0.8)', lineHeight: 1.7 }}>
          {t('payment_details', { iban: COMPANY.iban, name: COMPANY.name })}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(231,178,96,0.5)', fontStyle: 'italic' }}>
          {t('thank_you')}
        </div>
      </div>
    </div>
  )
})
