import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 max-w-lg mx-auto z-50 flex flex-col gap-2 px-4 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-2xl px-5 py-4 text-xl font-semibold shadow-xl text-white animate-fade-in-up ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-primary-700' : 'bg-green-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
