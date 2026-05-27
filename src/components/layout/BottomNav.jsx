import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tabs = [
  { to: '/', label: 'nav_dashboard', icon: '🏠' },
  { to: '/facturen', label: 'nav_invoices', icon: '📄' },
  { to: '/nieuw', label: 'nav_new', icon: '➕' },
  { to: '/klanten', label: 'nav_clients', icon: '👥' },
]

export function BottomNav() {
  const { t } = useTranslation('ui')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-stretch">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center min-h-[64px] py-2 gap-1 text-sm font-semibold transition-colors ${
                isActive
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              } ${tab.label === 'nav_new' ? 'relative' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-2xl ${tab.label === 'nav_new' ? 'bg-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-xs ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>
                  {t(tab.label)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
