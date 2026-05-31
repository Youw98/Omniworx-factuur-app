import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '../../constants/company'
import { SERVICES, UNITS } from '../../constants/services'
import { calcBtw, formatEuro } from '../../utils/btwCalc'

const BRAND_GREEN = '#0C3C3A'
const BRAND_GOLD = '#E7B260'
const BRAND_GOLD_LIGHT = '#F0CA8A'
const PAD = '0 48px'

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

export const QuotePreview = forwardRef(function QuotePreview({ quote }, ref) {
  const quoteLang = quote.invoiceLanguage || 'nl'
  const { t: tQ } = useTranslation('quote')
  const t = (key, opts) => tQ(key, { lng: quoteLang, ...opts })

  const isRtl = quoteLang === 'ar'
  const isAccepted = quote.status === 'accepted'
  const isExpiredOrRejected = quote.status === 'expired' || quote.status === 'rejected'

  const { subtotal, btwGroups, grandTotal } = calcBtw(quote.lineItems || [])
  const client = quote.client || {}

  const dir = isRtl ? 'rtl' : 'ltr'
  const textAlign = isRtl ? 'right' : 'left'
  const textAlignEnd = isRtl ? 'left' : 'right'
  const flexDir = isRtl ? 'row-reverse' : 'row'
  const bodyFont = isRtl
    ? '"Noto Sans Arabic", "Cairo", Arial, sans-serif'
    : '"Open Sans", Arial, sans-serif'

  const acceptedLabel = quoteLang === 'ar' ? 'مقبول' : quoteLang === 'en' ? 'ACCEPTED' : 'GEACCEPTEERD'
  const expiredLabel = quoteLang === 'ar' ? 'منتهية' : quoteLang === 'en' ? 'EXPIRED' : 'VERLOPEN'

  return (
    <div
      ref={ref}
      dir={dir}
      style={{ fontFamily: bodyFont, background: 'white', color: '#1a1a1a', width: '100%', position: 'relative' }}
      className="w-full bg-white"
    >
      {/* Diagonal accepted watermark */}
      {isAccepted && (
        <div style={{
          position: 'absolute', top: '42%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-28deg)',
          fontSize: 80, fontWeight: 900, color: '#16a34a', opacity: 0.07,
          fontFamily: 'Poppins, sans-serif', letterSpacing: 6,
          pointerEvents: 'none', whiteSpace: 'nowrap', userSelect: 'none', zIndex: 1,
        }}>
          {acceptedLabel}
        </div>
      )}

      {/* Diagonal expired/rejected watermark */}
      {isExpiredOrRejected && (
        <div style={{
          position: 'absolute', top: '42%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-28deg)',
          fontSize: 80, fontWeight: 900, color: '#6b7280', opacity: 0.07,
          fontFamily: 'Poppins, sans-serif', letterSpacing: 6,
          pointerEvents: 'none', whiteSpace: 'nowrap', userSelect: 'none', zIndex: 1,
        }}>
          {expiredLabel}
        </div>
      )}

      {/* Top gold stripe */}
      <div style={{ height: 6, background: BRAND_GOLD, width: '100%' }} />

      {/* Brand header */}
      <div style={{
        background: BRAND_GREEN,
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: flexDir,
        gap: 24,
      }}>
        <img src="/logo-stacked.webp" alt="Omniworx" style={{ height: 100, width: 'auto', display: 'block', flexShrink: 0 }} />
        <div style={{ textAlign: textAlignEnd, fontSize: 12, lineHeight: 1.85 }}>
          <div style={{ color: BRAND_GOLD_LIGHT, fontWeight: 600, fontSize: 13 }}>{COMPANY.name}</div>
          <div style={{ color: BRAND_GOLD_LIGHT, fontWeight: 500 }}>{COMPANY.address}</div>
          <div style={{ color: BRAND_GOLD_LIGHT, fontWeight: 500 }}>{COMPANY.postalCity}</div>
          <div style={{ color: 'rgba(231,178,96,0.65)', marginTop: 5 }}>KVK: {COMPANY.kvk}</div>
          <div style={{ color: 'rgba(231,178,96,0.65)' }}>BTW: {COMPANY.btwId}</div>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 3, background: `linear-gradient(${isRtl ? '270deg' : '90deg'}, ${BRAND_GOLD}, ${BRAND_GOLD}44)` }} />

      {/* Quote meta + Bill-to */}
      <div style={{
        padding: '28px 48px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: flexDir,
        gap: 32,
        borderBottom: `2px solid ${BRAND_GOLD}33`,
      }}>
        {/* Left: title + number + dates */}
        <div style={{ flex: '1 1 auto' }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontSize: 30, fontWeight: 900,
            color: BRAND_GREEN, margin: '0 0 6px', letterSpacing: 1,
          }}>
            {t('quote_title')}
          </h1>
          <div style={{ fontSize: 13, lineHeight: 2, color: '#374151' }}>
            <div>
              <span style={{ color: '#6b7280', marginInlineEnd: 8 }}>{t('quote_date')}:</span>
              <strong>{formatDate(quote.date, quoteLang)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280', marginInlineEnd: 8 }}>{t('valid_until')}:</span>
              <strong style={{ color: '#b45309' }}>{formatDate(quote.validUntil, quoteLang)}</strong>
            </div>
          </div>
        </div>

        {/* Right: Bill-to card — fixed width for consistent layout */}
        <div style={{
          flexShrink: 0,
          width: 240,
          textAlign: textAlignEnd,
          background: '#f8fafc',
          border: `1px solid ${BRAND_GOLD}44`,
          borderRadius: 10,
          padding: '14px 18px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: BRAND_GOLD, letterSpacing: 3, marginBottom: 8,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {t('bill_to')}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.85, color: '#1f2937' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: BRAND_GREEN, marginBottom: 2 }}>{client.name}</div>
            {client.address && <div style={{ color: '#4b5563' }}>{client.address}</div>}
            {(client.postalCode || client.city) && (
              <div style={{ color: '#4b5563' }}>{[client.postalCode, client.city].filter(Boolean).join(' ')}</div>
            )}
            {client.phone && <div style={{ color: '#6b7280', marginTop: 4 }}>{client.phone}</div>}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div style={{ padding: '20px 48px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ padding: '10px 12px', textAlign, fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 11, letterSpacing: 0.5, borderRadius: isRtl ? '0 6px 0 0' : '6px 0 0 0' }}>
                {t('description')}
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 11 }}>
                {t('quantity')}
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 11 }}>
                {t('unit_price')}
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 11 }}>
                {t('btw_rate')}
              </th>
              <th style={{ padding: '10px 12px', textAlign: textAlignEnd, fontWeight: 700, color: BRAND_GOLD, fontFamily: 'Poppins, sans-serif', background: BRAND_GREEN, fontSize: 11, borderRadius: isRtl ? '6px 0 0 0' : '0 6px 0 0' }}>
                {t('line_total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {(quote.lineItems || []).map((item, i) => {
              const lineEx = (item.quantity || 0) * (item.unitPrice || 0)
              const lineBtw = lineEx * (item.btwRate ?? 21) / 100
              const desc = getServiceLabel(item, quoteLang)
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid ${BRAND_GOLD}33`,
                    background: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                  }}
                >
                  <td style={{ padding: '12px 12px', color: '#1f2937', fontWeight: 500, wordBreak: 'break-word' }}>{desc}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#374151' }}>
                    {item.quantity}{item.unit ? ` ${getUnitLabel(item.unit, quoteLang)}` : ''}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#374151' }}>{formatEuro(item.unitPrice || 0)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: BRAND_GREEN, fontWeight: 600, fontSize: 12 }}>
                    {item.btwRate ?? 21}%
                  </td>
                  <td style={{ padding: '12px 12px', textAlign: textAlignEnd, fontWeight: 700, color: BRAND_GREEN }}>
                    {formatEuro(lineEx + lineBtw)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '12px 48px 28px', display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
        <div style={{
          width: 300,
          background: '#f8fafc',
          borderRadius: 10,
          border: `1px solid ${BRAND_GOLD}44`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13, color: '#374151' }}>
              <span>{t('subtotal')}</span>
              <span>{formatEuro(subtotal)}</span>
            </div>
            {Object.entries(btwGroups).map(([rate, amount]) => amount > 0 && (
              <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13, color: '#374151' }}>
                <span>{t('btw')} {rate}%</span>
                <span>{formatEuro(amount)}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 18, fontWeight: 900, color: 'white',
            background: BRAND_GREEN, padding: '12px 20px',
            fontFamily: 'Poppins, sans-serif',
          }}>
            <span>{t('grand_total')}</span>
            <span style={{ color: BRAND_GOLD }}>{formatEuro(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div style={{ padding: PAD, paddingBottom: 24 }}>
          <div style={{
            borderRadius: 8, border: `1px solid ${BRAND_GOLD}44`,
            background: '#fefce8', overflow: 'hidden',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: BRAND_GREEN, letterSpacing: 2,
              fontFamily: 'Poppins, sans-serif',
              padding: '8px 16px',
              borderBottom: `1px solid ${BRAND_GOLD}33`,
            }}>
              {t('notes')}
            </div>
            <div style={{ fontSize: 13, color: '#374151', padding: '12px 16px', lineHeight: 1.65 }}>
              {quote.notes}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: BRAND_GREEN, padding: '18px 48px 24px', marginTop: 8 }}>
        <div style={{ height: 2, background: BRAND_GOLD, marginBottom: 14, opacity: 0.35 }} />
        <div style={{ fontSize: 13, color: BRAND_GOLD, marginBottom: 4, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
          {t('valid_until_footer', { date: formatDate(quote.validUntil, quoteLang) })}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(231,178,96,0.8)', lineHeight: 1.7 }}>
          {t('contact_footer', { name: COMPANY.name, iban: COMPANY.iban })}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(231,178,96,0.45)', fontStyle: 'italic' }}>
          {t('thank_you')}
        </div>
      </div>
    </div>
  )
})
