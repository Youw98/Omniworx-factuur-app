import { useTranslation } from 'react-i18next'

export function StatusBadge({ status }) {
  const { t } = useTranslation('ui')
  const styles = {
    paid: 'bg-green-100 text-green-800 border border-green-300',
    unpaid: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    overdue: 'bg-red-100 text-red-800 border border-red-300',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-base font-semibold ${styles[status] || styles.unpaid}`}>
      {t(`status_${status}`) || status}
    </span>
  )
}
