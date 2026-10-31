// Page frame: bottom tab bar on phones, left sidebar on wider screens.
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icon'
import GuidedTour from './GuidedTour'
import { useTour } from '../lib/tour'

function TourButton() {
  const tour = useTour()
  return <button type="button" data-tour="restart" className="link-btn tour-replay" onClick={tour.start}>Replay guide</button>
}

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
    <GuidedTour><div className={`shell${isReviewPage ? ' shell--review' : ''}`}>
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
        <TourButton />
      </main>
    </div></GuidedTour>
  )
}
