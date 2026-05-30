import { useContext, useState } from 'react'
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

// Accept both old 6-char and new 8-char codes during transition
const WORKSPACE_CODE_REGEX = /^OWX-[A-Z0-9]{6,8}$/

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return 'OWX-' + Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

function readLocalData(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useWorkspace() {
  const { workspaceId, setWorkspaceId } = useContext(WorkspaceContext)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncError, setSyncError] = useState(null)

  const createWorkspace = async () => {
    setSyncStatus('loading')
    setSyncError(null)
    try {
      const code = generateCode()

      // Write the workspace document
      const workspaceRef = doc(db, 'workspaces', code)
      await setDoc(workspaceRef, { createdAt: new Date().toISOString() })

      // Migrate all local data to Firestore in a batch
      const invoices = readLocalData('omniworx_invoices')
      const quotes = readLocalData('omniworx_quotes')
      const clients = readLocalData('omniworx_clients')

      const batch = writeBatch(db)

      for (const item of invoices) {
        const ref = doc(db, 'workspaces', code, 'invoices', item.id)
        batch.set(ref, item)
      }
      for (const item of quotes) {
        const ref = doc(db, 'workspaces', code, 'quotes', item.id)
        batch.set(ref, item)
      }
      for (const item of clients) {
        const ref = doc(db, 'workspaces', code, 'clients', item.id)
        batch.set(ref, item)
      }

      await batch.commit()

      setWorkspaceId(code)
      setSyncStatus('idle')
    } catch (e) {
      console.error('createWorkspace error:', e)
      setSyncError('Aanmaken mislukt. Controleer je internetverbinding.')
      setSyncStatus('error')
    }
  }

  const joinWorkspace = async (code) => {
    const normalised = code.trim().toUpperCase()
    if (!WORKSPACE_CODE_REGEX.test(normalised)) {
      return { ok: false, error: 'Ongeldige code. Gebruik het formaat OWX-XXXXXX.' }
    }

    setSyncStatus('loading')
    setSyncError(null)
    try {
      const workspaceRef = doc(db, 'workspaces', normalised)
      const snap = await getDoc(workspaceRef)
      if (!snap.exists()) {
        setSyncStatus('idle')
        return { ok: false, error: 'Werkruimte niet gevonden. Controleer de code.' }
      }

      setWorkspaceId(normalised)
      setSyncStatus('idle')
      return { ok: true, error: null }
    } catch (e) {
      console.error('joinWorkspace error:', e)
      setSyncStatus('error')
      return { ok: false, error: 'Verbinden mislukt. Controleer je internetverbinding.' }
    }
  }

  const leaveWorkspace = () => {
    setWorkspaceId(null)
    setSyncStatus('idle')
    setSyncError(null)
  }

  const copyCode = async () => {
    if (!workspaceId) return
    try {
      await navigator.clipboard.writeText(workspaceId)
    } catch {
      // Fallback for older iOS
      const el = document.createElement('textarea')
      el.value = workspaceId
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  return {
    workspaceId,
    createWorkspace,
    joinWorkspace,
    leaveWorkspace,
    copyCode,
    syncStatus,
    syncError,
  }
}
