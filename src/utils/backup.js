import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const DATA_KEYS = ['omniworx_invoices', 'omniworx_quotes', 'omniworx_clients']
const LAST_BACKUP_KEY = 'omniworx_last_backup'

function collectData() {
  const out = { exportedAt: new Date().toISOString(), version: 2 }
  for (const key of DATA_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      out[key] = raw ? JSON.parse(raw) : []
    } catch {
      out[key] = []
    }
  }
  return out
}

export function downloadLocalBackup() {
  const data = collectData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `omniworx-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
}

export async function saveFirebaseBackup(workspaceId) {
  if (!workspaceId) throw new Error('No workspace connected')
  const data = collectData()
  const date = new Date().toISOString().split('T')[0]
  const backupRef = doc(db, 'workspaces', workspaceId, 'backups', date)
  await setDoc(backupRef, { ...data, savedAt: new Date().toISOString() })
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
}

export function getLastBackupDate() {
  const raw = localStorage.getItem(LAST_BACKUP_KEY)
  if (!raw) return null
  try { return new Date(raw) } catch { return null }
}

export function formatBackupDate(date) {
  if (!date) return null
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
