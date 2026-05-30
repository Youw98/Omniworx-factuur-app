import { useSyncedCollection } from './useSyncedCollection'

export function useClients() {
  const { items: clients, upsertItem, removeItem } = useSyncedCollection('omniworx_clients', 'clients')

  const addClient = (data) => {
    const client = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
    }
    upsertItem(client)
    return client
  }

  const updateClient = (id, data) => {
    const existing = clients.find(c => c.id === id)
    if (!existing) return
    upsertItem({ ...existing, ...data })
  }

  const deleteClient = (id) => {
    removeItem(id)
  }

  const getClient = (id) => clients.find(c => c.id === id)

  return { clients, addClient, updateClient, deleteClient, getClient }
}
