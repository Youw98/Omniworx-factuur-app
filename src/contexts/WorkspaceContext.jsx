import { createContext, useState } from 'react'

const STORAGE_KEY = 'omniworx_workspace_id'

export const WorkspaceContext = createContext({
  workspaceId: null,
  setWorkspaceId: () => {},
})

export function WorkspaceProvider({ children }) {
  const [workspaceId, setWorkspaceIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null
    } catch {
      return null
    }
  })

  const setWorkspaceId = (id) => {
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, id)
      }
    } catch (e) {
      console.error('Failed to persist workspaceId:', e)
    }
    setWorkspaceIdState(id)
  }

  return (
    <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
