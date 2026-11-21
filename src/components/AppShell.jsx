// Page frame: bottom tab bar on phones, left sidebar on wider screens.
import { Link, NavLink, Outlet } from 'react-router-dom'
import Icon from './Icon'
import ProductTour from './ProductTour'
import { useInvites } from '../lib/queries'

const TABS = [
  ['/', 'discover', 'Discover'],
  ['/post', 'post', 'Post'],
  ['/saved', 'saved', 'Saved'],
  ['/me', 'me', 'Me'],
]

export default function AppShell() {
  const { data: invites = [] } = useInvites()
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        {/* Desktop sidebar only. "/" with no ?mode is Discover in Swipe mode, from any page. */}
        <Link to="/" className="nav__logo wordmark" aria-label="ZotMunch home: Discover, Swipe">
          Zot<span>Munch</span>
        </Link>
        {TABS.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav__item">
            <span className="nav__icon">
              <Icon name={icon} />
              {icon === 'saved' && invites.length > 0 && <span className="dot nav__dot" aria-hidden="true" />}
            </span>
            <span>
              {label}
              {icon === 'saved' && invites.length > 0 && (
                <span className="sr-only">, {invites.length} invitation{invites.length === 1 ? '' : 's'}</span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
      <main className="shell__main">
        <Outlet />
      </main>
      <ProductTour />
    </div>
  )
}
