import { useTranslation } from 'react-i18next'

export function StatusBadge({ status }) {
  const { t } = useTranslation('ui')
  const styles = {
    paid: 'bg-green-600 text-white',
    unpaid: 'bg-amber-500 text-white',
    overdue: 'bg-red-600 text-white',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-base font-semibold ${styles[status] || styles.unpaid}`}>
      {t(`status_${status}`) || status}
    </span>
  )
}
