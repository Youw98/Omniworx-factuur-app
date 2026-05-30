import { useContext, useEffect, useRef, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

function readLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage write error:', e)
    window.dispatchEvent(new CustomEvent('omniworx:storage-error'))
  }
}

/**
 * A generic hook that syncs a collection with Firestore when a workspace is
 * active, and falls back to plain localStorage when no workspace is set.
 *
 * @param {string} localKey      - The localStorage key (e.g. 'omniworx_invoices')
 * @param {string} collectionName - The Firestore sub-collection name (e.g. 'invoices')
 * @returns {{ items, upsertItem, removeItem, setItems }}
 */
export function useSyncedCollection(localKey, collectionName) {
  const { workspaceId } = useContext(WorkspaceContext)

  // --- Local-only path ---
  const [localItems, setLocalItemsState] = useState(() =>
    readLocalStorage(localKey, [])
  )

  // Wrapped setter that also persists to localStorage (mirrors useLocalStorage behaviour)
  const setLocalItems = (valueOrFn) => {
    if (typeof valueOrFn === 'function') {
      setLocalItemsState(prev => {
        const next = valueOrFn(prev)
        writeLocalStorage(localKey, next)
        return next
      })
    } else {
      writeLocalStorage(localKey, valueOrFn)
      setLocalItemsState(valueOrFn)
    }
  }

  // --- Firestore path ---
  const [firestoreItems, setFirestoreItems] = useState(null) // null = not yet loaded
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    if (!workspaceId) {
      // Tear down any existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setFirestoreItems(null)
      return
    }

    // Set up Firestore listener — no server-side orderBy so documents
    // missing createdAt are not silently excluded; sort client-side instead.
    const colRef = collection(db, 'workspaces', workspaceId, collectionName)

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || '') > (a.createdAt || '') ? 1 : -1)
        setFirestoreItems(docs)
        // Keep localStorage in sync as an offline cache
        writeLocalStorage(localKey, docs)
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err)
      }
    )

    unsubscribeRef.current = unsub
    return () => {
      unsub()
      unsubscribeRef.current = null
    }
  }, [workspaceId, collectionName, localKey])

  // --- Unified interface ---
  const items = workspaceId
    ? (firestoreItems ?? readLocalStorage(localKey, [])) // use cache while loading
    : localItems

  /**
   * Create or update an item.
   * When workspace is active: optimistic local update + async Firestore write.
   * When local-only: identical to the old setItems behaviour.
   */
  const upsertItem = (item) => {
    if (!workspaceId) {
      // Local-only: just update state (caller is responsible for constructing the item)
      setLocalItems(prev => {
        const exists = prev.some(x => x.id === item.id)
        if (exists) {
          return prev.map(x => x.id === item.id ? item : x)
        }
        return [item, ...prev]
      })
      return
    }

    // Firestore path: optimistic update
    setFirestoreItems(prev => {
      const current = prev ?? []
      const exists = current.some(x => x.id === item.id)
      const updated = exists
        ? current.map(x => x.id === item.id ? item : x)
        : [item, ...current]
      writeLocalStorage(localKey, updated)
      return updated
    })

    // Background Firestore write
    const docRef = doc(db, 'workspaces', workspaceId, collectionName, item.id)
    setDoc(docRef, item).catch(err =>
      console.error('Firestore setDoc error:', err)
    )
  }

  /**
   * Remove an item by id.
   */
  const removeItem = (id) => {
    if (!workspaceId) {
      setLocalItems(prev => prev.filter(x => x.id !== id))
      return
    }

    setFirestoreItems(prev => {
      const updated = (prev ?? []).filter(x => x.id !== id)
      writeLocalStorage(localKey, updated)
      return updated
    })

    const docRef = doc(db, 'workspaces', workspaceId, collectionName, id)
    deleteDoc(docRef).catch(err =>
      console.error('Firestore deleteDoc error:', err)
    )
  }

  /**
   * setItems — for local-only usage (overdue/expiry side effects in useInvoices/useQuotes).
   * When workspace is active, it calls upsertItem for each changed item.
   */
  const setItems = (valueOrFn) => {
    if (!workspaceId) {
      setLocalItems(valueOrFn)
      return
    }

    // Workspace path: resolve the function against current items and upsert changed ones
    const current = firestoreItems ?? readLocalStorage(localKey, [])
    const next = typeof valueOrFn === 'function' ? valueOrFn(current) : valueOrFn

    if (next === current) return // no changes

    next.forEach(item => {
      const old = current.find(x => x.id === item.id)
      if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
        upsertItem(item)
      }
    })
  }

  return { items, upsertItem, removeItem, setItems }
}
