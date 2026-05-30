import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hashPin, verifyPin } from '../../utils/pinHash'
import { OmniworxWordmark } from './OmniworxLogo'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000
const LOCKOUT_KEY = 'omniworx_pin_lockout'

function readLockout() {
  try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}') } catch { return {} }
}
function writeLockout(data) {
  try { localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data)) } catch {}
}

export function PinLock({ pinHash, onUnlock, onSetPin }) {
  const { t } = useTranslation('ui')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState(!pinHash ? 'new' : 'enter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const isSettingUp = !pinHash

  // Brute-force lockout (only applies during login, not setup)
  const lockoutRef = useRef(readLockout())
  const now = Date.now()
  const initialUntil = lockoutRef.current.until || 0
  const [attempts, setAttempts] = useState(lockoutRef.current.attempts || 0)
  const [lockoutUntil, setLockoutUntil] = useState(initialUntil)
  const [secondsLeft, setSecondsLeft] = useState(
    !isSettingUp && initialUntil > now ? Math.ceil((initialUntil - now) / 1000) : 0
  )

  useEffect(() => {
    if (isSettingUp || lockoutUntil <= Date.now()) return
    const tick = () => {
      const left = Math.ceil((lockoutUntil - Date.now()) / 1000)
      setSecondsLeft(Math.max(0, left))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [lockoutUntil, isSettingUp])

  const isLocked = !isSettingUp && secondsLeft > 0

  const currentTarget = step === 'confirm' ? confirmPin : pin
  const setCurrentTarget = step === 'confirm' ? setConfirmPin : setPin
  const title = isSettingUp
    ? step === 'confirm' ? t('pin_confirm_title') : t('pin_new_title')
    : t('pin_title')

  const handleDigit = async (digit) => {
    if (loading || isLocked) return
    const next = currentTarget + digit
    setCurrentTarget(next)
    setError('')

    if (next.length === 4) {
      setLoading(true)
      if (isSettingUp) {
        if (step === 'new') {
          setLoading(false)
          setStep('confirm')
        } else {
          if (next === pin) {
            const hash = await hashPin(pin)
            onSetPin(hash)
          } else {
            setError(t('pin_error_match'))
            setPin('')
            setConfirmPin('')
            setStep('new')
          }
          setLoading(false)
        }
      } else {
        const { valid, legacy } = await verifyPin(next, pinHash)
        if (valid) {
          writeLockout({})
          if (legacy) {
            const upgraded = await hashPin(next)
            onSetPin(upgraded)
          }
          onUnlock()
        } else {
          const newAttempts = attempts + 1
          const shouldLock = newAttempts >= MAX_ATTEMPTS
          const until = shouldLock ? Date.now() + LOCKOUT_MS : (lockoutUntil || 0)
          writeLockout({ attempts: newAttempts, until })
          setAttempts(newAttempts)
          if (shouldLock) {
            setLockoutUntil(until)
            setSecondsLeft(Math.ceil(LOCKOUT_MS / 1000))
          }
          setError(shouldLock ? '' : t('pin_error_wrong'))
          setPin('')
        }
        setLoading(false)
      }
    }
  }

  const handleDelete = () => {
    setCurrentTarget(prev => prev.slice(0, -1))
    setError('')
  }

  const handleReset = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('omniworx'))
      .forEach(k => localStorage.removeItem(k))
    indexedDB.databases?.().then(dbs =>
      dbs.forEach(db => indexedDB.deleteDatabase(db.name))
    ).catch(() => {})
    window.location.reload()
  }

  const displayPin = isSettingUp && step === 'confirm' ? confirmPin : pin

  return (
    <div className="min-h-screen bg-primary-700 flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo */}
      <OmniworxWordmark variant="stacked" height={160} className="mx-auto" />

      {/* Title */}
      <p className="text-gold-300 text-2xl font-semibold font-poppins">{title}</p>

      {/* PIN dots */}
      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all ${
              displayPin.length > i ? 'bg-gold-400 scale-110' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {isLocked && (
        <p className="text-orange-300 text-xl font-semibold text-center px-4">
          {t('pin_too_many_attempts', { seconds: secondsLeft })}
        </p>
      )}
      {!isLocked && error && <p className="text-red-300 text-xl font-semibold text-center">{error}</p>}

      {loading && <p className="text-gold-300/70 text-lg animate-pulse">{t('pin_checking')}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(String(d))}
            disabled={loading || displayPin.length >= 4 || isLocked}
            className="min-h-[72px] text-3xl font-bold text-white bg-white/20 rounded-2xl active:bg-white/40 transition-colors disabled:opacity-50 font-poppins"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          disabled={loading || displayPin.length >= 4 || isLocked}
          className="min-h-[72px] text-3xl font-bold text-white bg-white/20 rounded-2xl active:bg-white/40 transition-colors disabled:opacity-50 font-poppins"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || isLocked}
          className="min-h-[72px] text-3xl text-white bg-white/20 rounded-2xl active:bg-white/40 transition-colors disabled:opacity-50"
        >
          ⌫
        </button>
      </div>

      {/* Forgot PIN */}
      {!isSettingUp && (
        <button
          onClick={() => setShowReset(true)}
          className="text-gold-300/60 text-lg underline mt-2 min-h-[56px] px-4"
        >
          {t('pin_forgot')}
        </button>
      )}

      {/* Reset confirm dialog */}
      {showReset && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-2xl font-bold text-red-600 mb-3 text-center">⚠️ {t('pin_forgot')}</p>
            <p className="text-lg text-gray-700 mb-6 text-center">{t('pin_reset_warning')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                className="w-full min-h-[56px] text-xl font-bold bg-red-600 text-white rounded-2xl"
              >
                {t('pin_reset_confirm')}
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="w-full min-h-[56px] text-xl font-semibold bg-gray-100 text-gray-800 rounded-2xl"
              >
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
