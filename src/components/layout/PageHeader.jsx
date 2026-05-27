import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function PageHeader({ title, showBack = false, backTo, rightAction }) {
  const navigate = useNavigate()
  const { t } = useTranslation('ui')
  const isRtl = document.documentElement.dir === 'rtl'

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className="sticky top-0 bg-primary-800 text-white z-30 shadow-md">
      <div className="flex items-center min-h-[64px] px-4 gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
            aria-label={t('btn_back')}
          >
            <span className={`text-2xl ${isRtl ? 'rotate-180' : ''} inline-block`}>←</span>
          </button>
        )}
        <h1 className="flex-1 text-2xl font-bold truncate">{title}</h1>
        {rightAction}
      </div>
    </header>
  )
}
