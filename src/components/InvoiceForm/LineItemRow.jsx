import { useTranslation } from 'react-i18next'
import { SERVICES, BTW_RATES } from '../../constants/services'
import { formatEuro } from '../../utils/btwCalc'
import { BigInput } from '../UI/BigInput'
import { PaintRollerIcon, FaucetIcon } from '../UI/OmniworxLogo'

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
      onChange(index, { ...item, serviceId: 'other', description: '', btwRate: 21 })
    } else {
      const svc = SERVICES.find(s => s.id === id)
      onChange(index, {
        ...item,
        serviceId: id,
        description: svc ? (svc[uiLanguage] || svc.nl) : '',
        btwRate: svc?.defaultBtwRate ?? 21,
      })
    }
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
      {/* Service selector */}
      <div className="flex flex-col gap-1">
        <label className="text-lg font-semibold text-gray-700 font-poppins">{t('label_service')}</label>
        <select
          value={item.serviceId || ''}
          onChange={handleServiceChange}
          className="w-full min-h-[52px] text-xl px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:border-primary-700 bg-white"
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
            {(item.serviceId === 'binnen_buiten' || item.serviceId === 'afwerkingen') && (
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

      {/* Quantity + Price */}
      <div className="grid grid-cols-2 gap-3">
        <BigInput
          label={t('label_quantity')}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={item.quantity || ''}
          onChange={e => update('quantity', parseFloat(e.target.value) || 0)}
          placeholder="1"
        />
        <BigInput
          label={t('label_unit_price_short')}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={item.unitPrice || ''}
          onChange={e => update('unitPrice', parseFloat(e.target.value) || 0)}
          placeholder="0,00"
        />
      </div>

      {/* BTW rate selection */}
      <div className="flex flex-col gap-2">
        <label className="text-lg font-semibold text-gray-700 font-poppins">{t('label_btw_rate')}</label>
        <div className="flex gap-2">
          {BTW_RATES.map(rate => (
            <button
              key={rate}
              type="button"
              onClick={() => update('btwRate', rate)}
              className={`flex-1 min-h-[52px] text-xl font-semibold rounded-xl border-2 transition-all font-poppins ${
                (item.btwRate ?? 21) === rate
                  ? 'bg-primary-700 text-gold-400 border-primary-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>
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
          className="min-w-[52px] min-h-[52px] flex items-center justify-center rounded-xl bg-red-50 text-red-600 text-2xl hover:bg-red-100 transition-colors"
          aria-label="Verwijder regel"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
