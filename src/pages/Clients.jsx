import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClients } from '../hooks/useClients'
import { PageHeader } from '../components/layout/PageHeader'
import { BigButton } from '../components/UI/BigButton'
import { BigInput } from '../components/UI/BigInput'
import { EmptyState } from '../components/UI/EmptyState'
import { ConfirmDialog } from '../components/UI/ConfirmDialog'
import { WorkerIcon } from '../components/UI/OmniworxLogo'

function ClientForm({ initial = {}, onSave, onCancel }) {
  const { t } = useTranslation('ui')
  const [data, setData] = useState({ name: '', address: '', postalCode: '', city: '', email: '', phone: '', ...initial })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setData(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!data.name.trim()) e.name = t('error_required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(data)
  }

  return (
    <div className="flex flex-col gap-4">
      <BigInput label={t('label_name')} value={data.name} onChange={e => set('name', e.target.value)} error={errors.name} />
      <BigInput label={t('label_address')} value={data.address} onChange={e => set('address', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <BigInput label={t('label_postal_code')} value={data.postalCode} onChange={e => set('postalCode', e.target.value)} />
        <BigInput label={t('label_city')} value={data.city} onChange={e => set('city', e.target.value)} />
      </div>
      <BigInput label={t('label_email')} type="email" inputMode="email" value={data.email} onChange={e => set('email', e.target.value)} />
      <BigInput label={t('label_phone')} type="tel" inputMode="tel" value={data.phone} onChange={e => set('phone', e.target.value)} />
      <div className="flex flex-col gap-3 pt-2">
        <BigButton onClick={handleSave}>{t('btn_save')}</BigButton>
        <BigButton variant="secondary" onClick={onCancel}>{t('btn_cancel')}</BigButton>
      </div>
    </div>
  )
}

export function Clients() {
  const { t } = useTranslation('ui')
  const { clients, addClient, updateClient, deleteClient } = useClients()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  const editingClient = clients.find(c => c.id === editingId)

  const handleAdd = (data) => {
    addClient(data)
    setMode('list')
  }

  const handleUpdate = (data) => {
    updateClient(editingId, data)
    setMode('list')
    setEditingId(null)
  }

  const handleDelete = () => {
    deleteClient(deleteId)
    setDeleteId(null)
    if (mode === 'edit') setMode('list')
  }

  if (mode === 'add') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader title={t('new_client')} showBack />
        <div className="p-4 pb-24"><ClientForm onSave={handleAdd} onCancel={() => setMode('list')} /></div>
      </div>
    )
  }

  if (mode === 'edit' && editingClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader
          title={t('edit_client')}
          showBack
          rightAction={
            <button
              onClick={() => setDeleteId(editingClient.id)}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl hover:bg-white/20 text-2xl"
            >🗑️</button>
          }
        />
        <div className="p-4 pb-24">
          <ClientForm initial={editingClient} onSave={handleUpdate} onCancel={() => { setMode('list'); setEditingId(null) }} />
        </div>
        {deleteId && (
          <ConfirmDialog
            message={t('confirm_delete_client')}
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title={t('clients_title')} />

      <div className="p-4 flex flex-col gap-4 pb-24">
        <BigButton onClick={() => setMode('add')}>➕ {t('btn_add_client')}</BigButton>

        {clients.length > 0 && (
          <BigInput
            placeholder={t('label_search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}

        {filtered.length === 0 && clients.length === 0 ? (
          <EmptyState icon={<WorkerIcon size={56} color="#E7B260"/>} message={t('clients_empty')} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-xl py-8">Geen klanten gevonden</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { setEditingId(c.id); setMode('edit') }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-gold-400 transition-colors"
              >
                <p className="text-xl font-bold text-gray-800">{c.name}</p>
                {(c.address || c.city) && (
                  <p className="text-base text-gray-500 mt-1">{c.address}{c.address && c.city ? ', ' : ''}{c.postalCode} {c.city}</p>
                )}
                {c.phone && <p className="text-base text-gray-400">{c.phone}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
