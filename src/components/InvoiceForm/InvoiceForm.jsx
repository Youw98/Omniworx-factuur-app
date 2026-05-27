import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClients } from '../../hooks/useClients'
import { useSettings } from '../../hooks/useSettings'
import { calcBtw, formatEuro } from '../../utils/btwCalc'
import { BigButton } from '../UI/BigButton'
import { BigInput } from '../UI/BigInput'
import { BigSelect } from '../UI/BigSelect'
import { LineItemRow } from './LineItemRow'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function newLineItem() {
  return { id: crypto.randomUUID(), serviceId: '', description: '', quantity: 1, unitPrice: 0, btwRate: 21 }
}

const INVOICE_LANGS = ['nl', 'ar', 'en']
const LANG_LABELS = { nl: '🇳🇱 Nederlands', ar: '🇸🇦 Arabisch', en: '🇬🇧 Engels' }

export function InvoiceForm({ initial, onSave, onCancel }) {
  const { t, i18n } = useTranslation('ui')
  const { clients } = useClients()
  const { settings } = useSettings()
  const uiLang = i18n.language

  const [date, setDate] = useState(initial?.date || todayIso())
  const [dueDate, setDueDate] = useState(initial?.dueDate || addDays(todayIso(), settings.defaultDueDays || 14))
  const [invoiceLanguage, setInvoiceLanguage] = useState(initial?.invoiceLanguage || settings.defaultInvoiceLanguage || 'nl')
  const [lineItems, setLineItems] = useState(initial?.lineItems?.length ? initial.lineItems : [newLineItem()])
  const [notes, setNotes] = useState(initial?.notes || '')
  const [clientMode, setClientMode] = useState(initial?.client?.id ? 'saved' : 'manual')
  const [selectedClientId, setSelectedClientId] = useState(initial?.client?.id || '')
  const [clientSearch, setClientSearch] = useState('')
  const [manualClient, setManualClient] = useState(
    initial?.client || { name: '', address: '', postalCode: '', city: '', email: '', phone: '' }
  )
  const [errors, setErrors] = useState({})
  const [showClientPicker, setShowClientPicker] = useState(false)

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const totals = calcBtw(lineItems)

  const validate = () => {
    const e = {}
    const client = clientMode === 'saved' ? selectedClient : manualClient
    if (!client?.name) e.clientName = t('error_required')
    if (lineItems.length === 0) e.lineItems = t('error_required')
    lineItems.forEach((item, i) => {
      if (!item.description && item.serviceId !== 'other') e[`item_${i}`] = t('error_required')
      if (item.serviceId === 'other' && !item.description) e[`item_${i}`] = t('error_required')
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const clientSnapshot = clientMode === 'saved' ? { ...selectedClient } : { ...manualClient, id: null }
    onSave({ date, dueDate, invoiceLanguage, lineItems, notes, client: clientSnapshot })
  }

  const updateLineItem = (index, item) => {
    setLineItems(prev => prev.map((it, i) => i === index ? item : it))
  }

  const deleteLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, { ...newLineItem(), btwRate: settings.defaultBtwRate || 21 }])
  }

  return (
    <div className="flex flex-col gap-5 pb-32">

      {/* Invoice Language */}
      <section className="flex flex-col gap-3">
        <label className="text-lg font-semibold text-gray-700">{t('label_invoice_language')}</label>
        <div className="flex gap-2">
          {INVOICE_LANGS.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => setInvoiceLanguage(lang)}
              className={`flex-1 min-h-[52px] text-lg font-semibold rounded-xl border-2 transition-all ${
                invoiceLanguage === lang ? 'bg-primary-700 text-gold-300 border-primary-700' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Dates */}
      <section className="grid grid-cols-2 gap-3">
        <BigInput
          label={t('label_date')}
          type="date"
          value={date}
          onChange={e => {
            setDate(e.target.value)
            setDueDate(addDays(e.target.value, settings.defaultDueDays || 14))
          }}
        />
        <BigInput
          label={t('label_due_date')}
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </section>

      {/* Client Section */}
      <section className="flex flex-col gap-3">
        <label className="text-lg font-semibold text-gray-700">{t('label_client')}</label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setClientMode('saved')}
            className={`flex-1 min-h-[52px] text-lg font-semibold rounded-xl border-2 transition-all ${
              clientMode === 'saved' ? 'bg-primary-700 text-gold-300 border-primary-700' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            📋 {t('btn_choose_client')}
          </button>
          <button
            type="button"
            onClick={() => setClientMode('manual')}
            className={`flex-1 min-h-[52px] text-lg font-semibold rounded-xl border-2 transition-all ${
              clientMode === 'manual' ? 'bg-primary-700 text-gold-300 border-primary-700' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            ✏️ {t('btn_manual_client')}
          </button>
        </div>

        {clientMode === 'saved' && (
          <div>
            {selectedClient ? (
              <div className="bg-primary-50 border-2 border-gold-300 rounded-2xl p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-primary-800">{selectedClient.name}</p>
                  <p className="text-lg text-primary-700">{selectedClient.address}, {selectedClient.postalCode} {selectedClient.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId('')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-2xl text-gray-500 hover:text-red-600"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClientPicker(true)}
                className={`w-full min-h-[56px] text-xl rounded-2xl border-2 border-dashed ${errors.clientName ? 'border-red-400 text-red-600' : 'border-gray-400 text-gray-500'} hover:border-primary-700 hover:text-primary-600 transition-colors`}
              >
                👤 {t('btn_choose_client')}
              </button>
            )}
            {errors.clientName && <p className="text-red-600 text-base mt-1">{errors.clientName}</p>}
          </div>
        )}

        {clientMode === 'manual' && (
          <div className="flex flex-col gap-3 bg-gray-50 rounded-2xl p-4">
            <BigInput label={t('label_name')} value={manualClient.name} onChange={e => setManualClient(p => ({ ...p, name: e.target.value }))} error={errors.clientName} />
            <BigInput label={t('label_address')} value={manualClient.address} onChange={e => setManualClient(p => ({ ...p, address: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <BigInput label={t('label_postal_code')} value={manualClient.postalCode} onChange={e => setManualClient(p => ({ ...p, postalCode: e.target.value }))} />
              <BigInput label={t('label_city')} value={manualClient.city} onChange={e => setManualClient(p => ({ ...p, city: e.target.value }))} />
            </div>
            <BigInput label={t('label_phone')} type="tel" value={manualClient.phone} onChange={e => setManualClient(p => ({ ...p, phone: e.target.value }))} />
          </div>
        )}
      </section>

      {/* Line Items */}
      <section className="flex flex-col gap-3">
        <label className="text-lg font-semibold text-gray-700">Werkzaamheden</label>
        {lineItems.map((item, i) => (
          <LineItemRow
            key={item.id}
            item={item}
            index={i}
            onChange={updateLineItem}
            onDelete={deleteLineItem}
            uiLanguage={uiLang}
          />
        ))}
        <button
          type="button"
          onClick={addLineItem}
          className="w-full min-h-[56px] text-xl font-semibold rounded-2xl border-2 border-dashed border-primary-400 text-primary-700 hover:bg-primary-50 transition-colors"
        >
          {t('btn_add_line')}
        </button>
      </section>

      {/* Totals */}
      <section className="bg-primary-700 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex justify-between text-lg text-gold-300/80">
          <span>{t('total_excl')}</span>
          <span>{formatEuro(totals.subtotal)}</span>
        </div>
        {Object.entries(totals.btwGroups).map(([rate, amount]) => (
          amount > 0 && (
            <div key={rate} className="flex justify-between text-lg text-gold-300/80">
              <span>{t('total_btw')} {rate}%</span>
              <span>{formatEuro(amount)}</span>
            </div>
          )
        ))}
        <div className="border-t-2 border-gold-500/50 pt-3 flex justify-between text-2xl font-bold text-gold-400 font-poppins">
          <span>{t('total_incl')}</span>
          <span>{formatEuro(totals.grandTotal)}</span>
        </div>
      </section>

      {/* Notes */}
      <section className="flex flex-col gap-1">
        <label className="text-lg font-medium text-gray-700">{t('label_notes')}</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full text-xl px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:border-primary-700 bg-white resize-none"
          placeholder="Optionele opmerkingen..."
        />
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <BigButton onClick={handleSave}>{t('btn_save')}</BigButton>
        {onCancel && <BigButton variant="secondary" onClick={onCancel}>{t('btn_cancel')}</BigButton>}
      </div>

      {/* Client Picker Modal */}
      {showClientPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t('select_client_title')}</h2>
              <button onClick={() => setShowClientPicker(false)} className="text-3xl text-gray-500 min-w-[44px] min-h-[44px]">✕</button>
            </div>
            <input
              autoFocus
              type="text"
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              placeholder={t('label_search')}
              className="w-full min-h-[52px] text-xl px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:border-primary-700 mb-3"
            />
            <div className="overflow-y-auto flex-1">
              {filteredClients.length === 0 ? (
                <p className="text-center text-gray-400 text-xl py-8">{t('clients_empty')}</p>
              ) : filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClientId(c.id)
                    setShowClientPicker(false)
                    setClientSearch('')
                  }}
                  className="w-full text-left p-4 border-b border-gray-100 hover:bg-primary-50 transition-colors"
                >
                  <p className="text-xl font-semibold">{c.name}</p>
                  <p className="text-base text-gray-500">{c.address}, {c.postalCode} {c.city}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
