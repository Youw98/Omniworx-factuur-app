import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hashPin } from '../../utils/pinHash'
import { OmniworxWordmark } from './OmniworxLogo'

export function PinLock({ pinHash, onUnlock, onSetPin }) {
  const { t } = useTranslation('ui')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState('enter') // 'enter' | 'new' | 'confirm'
  const [error, setError] = useState('')

  const isSettingUp = !pinHash
  const currentTarget = step === 'confirm' ? confirmPin : pin
  const setCurrentTarget = step === 'confirm' ? setConfirmPin : setPin
  const title = isSettingUp
    ? step === 'confirm' ? t('pin_confirm_title') : t('pin_new_title')
    : t('pin_title')

  const handleDigit = async (digit) => {
    const next = currentTarget + digit
    setCurrentTarget(next)
    setError('')

    if (next.length === 4) {
      if (isSettingUp) {
        if (step === 'new') {
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
        }
      } else {
        const hash = await hashPin(next)
        if (hash === pinHash) {
          onUnlock()
        } else {
          setError(t('pin_error_wrong'))
          setPin('')
        }
      }
    }
  }

  const handleDelete = () => {
    setCurrentTarget(prev => prev.slice(0, -1))
    setError('')
  }

  const displayPin = isSettingUp && step === 'confirm' ? confirmPin : pin

  return (
    <div className="min-h-screen bg-primary-700 flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo */}
      <OmniworxWordmark className="justify-center" />

      {/* Title */}
      <p className="text-gold-300 text-2xl font-semibold font-poppins">{title}</p>

      {/* PIN dots */}
      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 border-gold-400 transition-all ${
              displayPin.length > i ? 'bg-gold-400 scale-110' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-300 text-xl text-center font-poppins">{error}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(String(d))}
            className="min-h-[72px] text-3xl font-bold text-white rounded-2xl bg-white/10 border border-white/20 active:bg-gold-500/40 active:text-primary-800 transition-all font-poppins"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="min-h-[72px] text-3xl font-bold text-white rounded-2xl bg-white/10 border border-white/20 active:bg-gold-500/40 active:text-primary-800 transition-all font-poppins"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="min-h-[72px] text-2xl text-white rounded-2xl bg-white/10 border border-white/20 active:bg-red-500/30 transition-all"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
