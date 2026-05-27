import { useLocalStorage } from './useLocalStorage'

export function useClients() {
  const [clients, setClients] = useLocalStorage('omniworx_clients', [])

  const addClient = (data) => {
    const client = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
    }
    setClients(prev => [client, ...prev])
    return client
  }

  const updateClient = (id, data) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }

  const deleteClient = (id) => {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const getClient = (id) => clients.find(c => c.id === id)

  return { clients, addClient, updateClient, deleteClient, getClient }
}
