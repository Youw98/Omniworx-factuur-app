import { useTranslation } from 'react-i18next'
import { BigButton } from './BigButton'

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel }) {
  const { t } = useTranslation('ui')
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-xl text-gray-800 mb-6 text-center font-medium">{message}</p>
        <div className="flex flex-col gap-3">
          <BigButton variant="danger" onClick={onConfirm}>{confirmLabel ?? t('btn_confirm_delete')}</BigButton>
          <BigButton variant="secondary" onClick={onCancel}>{t('btn_cancel')}</BigButton>
        </div>
      </div>
    </div>
  )
}
