import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    if (value instanceof Function) {
      setStoredValue(prev => {
        try {
          const next = value(prev)
          localStorage.setItem(key, JSON.stringify(next))
          return next
        } catch (e) {
          console.error('localStorage write error:', e)
          window.dispatchEvent(new CustomEvent('omniworx:storage-error'))
          return prev
        }
      })
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        setStoredValue(value)
      } catch (e) {
        console.error('localStorage write error:', e)
        window.dispatchEvent(new CustomEvent('omniworx:storage-error'))
      }
    }
  }

  const clearValue = () => {
    localStorage.removeItem(key)
    setStoredValue(initialValue)
  }

  return [storedValue, setValue, clearValue]
}
