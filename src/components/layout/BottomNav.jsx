import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isNative } from '../../utils/platform'

const allTabs = [
  { to: '/', label: 'nav_dashboard', icon: '🏠' },
  { to: '/facturen', label: 'nav_invoices', icon: '📄' },
  { to: '/nieuw', label: 'nav_new', icon: '➕', nativeOnly: true },
  { to: '/offerten', label: 'nav_quotes', icon: '📋' },
  { to: '/klanten', label: 'nav_clients', icon: '👥' },
]

export function BottomNav() {
  const { t } = useTranslation('ui')
  const tabs = isNative() ? allTabs : allTabs.filter(tab => !tab.nativeOnly)

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t-2 border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-stretch">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center min-h-[64px] py-2 gap-0.5 transition-colors ${
                isActive ? 'text-primary-700 bg-primary-50 border-t-2 border-gold-500' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl ${
                  tab.nativeOnly
                    ? 'bg-gold-500 text-primary-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-lg'
                    : ''
                }`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-semibold font-poppins leading-tight ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>
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
