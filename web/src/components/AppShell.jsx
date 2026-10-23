// Page frame: bottom tab bar on phones, left sidebar on wider screens.
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icon'

const TABS = [
  ['/', 'discover', 'Discover'],
  ['/post', 'post', 'Post'],
  ['/saved', 'saved', 'Saved'],
  ['/me', 'me', 'Me'],
]

export default function AppShell() {
  const { pathname } = useLocation()
  const isReviewPage = pathname.endsWith('/review')

  return (
    <div className={`shell${isReviewPage ? ' shell--review' : ''}`}>
      <nav className="nav" aria-label="Main">
        <p className="nav__logo wordmark">
          Zot<span>Munch</span>
        </p>
        {TABS.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav__item">
            <span className="nav__icon">
              <Icon name={icon} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}
