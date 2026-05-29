import { useTranslation } from 'react-i18next'
import { SERVICES, UNITS, BTW_RATES } from '../../constants/services'
import { formatEuro } from '../../utils/btwCalc'
import { BigInput } from '../UI/BigInput'
import { PaintRollerIcon, FaucetIcon } from '../UI/OmniworxLogo'

const BTW_NINE_AGE_SERVICES = new Set(['schilderwerk', 'stukadoorwerk', 'behangen', 'isoleren'])
const BTW_NINE_CLEAN_SERVICES = new Set(['schoonmaakwerk'])

const UNIT_STEP = { uur: '0.5', dag: '0.5', stuk: '1', m: '0.1', 'm²': '0.1', 'm³': '0.1' }

export function LineItemRow({ item, index, onChange, onDelete, uiLanguage }) {
  const { t } = useTranslation('ui')
  const primaryServices = SERVICES.filter(s => s.isPrimary)
  const secondaryServices = SERVICES.filter(s => !s.isPrimary && s.id !== 'other')
  const serviceLabel = (s) => `${s.icon} ${s[uiLanguage] || s.nl}`

  const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
  const btwAmount = lineTotal * (item.btwRate ?? 21) / 100

  const update = (field, value) => onChange(index, { ...item, [field]: value })

  const handleServiceChange = (e) => {
    const id = e.target.value
    if (id === 'other') {
      onChange(index, { ...item, serviceId: 'other', description: '', unit: item.unit || 'uur', btwRate: 21 })
    } else if (!id) {
      onChange(index, { ...item, serviceId: '', description: '' })
    } else {
      const svc = SERVICES.find(s => s.id === id)
      onChange(index, {
        ...item,
        serviceId: id,
        description: svc ? (svc[uiLanguage] || svc.nl) : '',
        btwRate: svc?.defaultBtwRate ?? 21,
        unit: svc?.unit || item.unit || 'uur',
        unitPrice: svc?.defaultPrice || item.unitPrice || 0,
      })
    }
  }

  const currentUnit = item.unit || 'uur'
  const quantityStep = UNIT_STEP[currentUnit] || '1'

  const svc = item.serviceId ? SERVICES.find(s => s.id === item.serviceId) : null
  const showPriceRange = svc && svc.minPrice > 0 && svc.maxPrice > 0
  const showBtw9AgeWarning = (item.btwRate ?? 21) === 9 && BTW_NINE_AGE_SERVICES.has(item.serviceId)
  const showBtw9CleanWarning = (item.btwRate ?? 21) === 9 && BTW_NINE_CLEAN_SERVICES.has(item.serviceId)

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Service selector */}
      <div className="flex flex-col gap-1">
        <label className="text-lg font-semibold text-gray-700 font-poppins">{t('label_service')}</label>
        <select
          value={item.serviceId || ''}
          onChange={handleServiceChange}
          className="w-full min-h-[56px] text-xl px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:border-primary-700 bg-white"
        >
          <option value="">— Kies dienst —</option>
          <optgroup label="⭐ Hoofddiensten">
            {primaryServices.map(s => (
              <option key={s.id} value={s.id}>{serviceLabel(s)}</option>
            ))}
          </optgroup>
          <optgroup label="Overige diensten">
            {secondaryServices.map(s => (
              <option key={s.id} value={s.id}>{serviceLabel(s)}</option>
            ))}
            <option value="other">{serviceLabel(SERVICES.find(s => s.id === 'other'))}</option>
          </optgroup>
        </select>
        {item.serviceId && item.serviceId !== '' && item.serviceId !== 'other' && (
          <div className="flex items-center gap-2 text-primary-700 text-base font-medium px-1">
            {(item.serviceId === 'schilderwerk' || item.serviceId === 'stukadoorwerk') && (
              <PaintRollerIcon size={22} color="#E7B260"/>
            )}
            {item.serviceId === 'loodgieter' && (
              <FaucetIcon size={22} color="#E7B260"/>
            )}
          </div>
        )}
      </div>

      {/* Custom description if 'other' */}
      {item.serviceId === 'other' && (
        <BigInput
          label={t('label_custom_service')}
          value={item.description || ''}
          onChange={e => update('description', e.target.value)}
          placeholder="Omschrijving van de werkzaamheden"
        />
      )}

      {/* Quantity + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <BigInput
          label={t('label_quantity')}
          type="number"
          inputMode="decimal"
          min="0"
          step={quantityStep}
          value={item.quantity || ''}
          onChange={e => update('quantity', parseFloat(e.target.value) || 0)}
          placeholder="1"
        />
        <div className="flex flex-col gap-1">
          <label className="text-lg font-semibold text-gray-700 font-poppins">{t('label_unit')}</label>
          <select
            value={currentUnit}
            onChange={e => update('unit', e.target.value)}
            className="w-full min-h-[56px] text-xl px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:border-primary-700 bg-white"
          >
            {UNITS.map(u => (
              <option key={u.value} value={u.value}>{u.value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit price + range hint */}
      <div className="flex flex-col gap-1">
        <BigInput
          label={`${t('label_unit_price_short')} / ${currentUnit}`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={item.unitPrice || ''}
          onChange={e => update('unitPrice', parseFloat(e.target.value) || 0)}
          placeholder="0,00"
        />
        {showPriceRange && (
          <p className="text-sm text-gray-400 px-1">
            Marktprijs: {formatEuro(svc.minPrice)} – {formatEuro(svc.maxPrice)} / {currentUnit}
          </p>
        )}
      </div>

      {/* BTW rate selection + condition warning */}
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold text-gray-700 font-poppins">{t('label_btw_rate')}</label>
        <div className="flex gap-2">
          {BTW_RATES.map(rate => (
            <button
              key={rate}
              type="button"
              onClick={() => update('btwRate', rate)}
              className={`flex-1 min-h-[56px] text-xl font-semibold rounded-xl border-2 transition-all font-poppins ${
                (item.btwRate ?? 21) === rate
                  ? 'bg-primary-700 text-gold-400 border-primary-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>
        {showBtw9AgeWarning && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ 9% geldt alleen bij woningen ouder dan 2 jaar bestemd voor permanente bewoning. Anders 21%.
          </p>
        )}
        {showBtw9CleanWarning && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ 9% geldt voor schoonmaakwerk ín woningen. Buiten of specialistisch werk: 21%.
          </p>
        )}
      </div>

      {/* Row total + delete */}
      <div className="flex items-center justify-between pt-2 border-t-2 border-gray-100">
        <div>
          <p className="text-base text-gray-500">{formatEuro(lineTotal)} + {formatEuro(btwAmount)} BTW</p>
          <p className="text-2xl font-bold text-primary-700 font-poppins">{formatEuro(lineTotal + btwAmount)}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="min-w-[56px] min-h-[56px] flex items-center justify-center rounded-xl bg-red-50 text-red-600 text-2xl hover:bg-red-100 transition-colors"
          aria-label="Verwijder regel"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
