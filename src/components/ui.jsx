// Small shared pieces from the Figma working kit.
import { Link, useNavigate } from 'react-router-dom'
import { DELETED_MASCOT } from '../lib/deleted'
import { fallBackTo } from '../lib/photo'
import Icon from './Icon'

export function Chip({ selected, tone, onClick, children }) {
  const cls = ['chip', selected && 'chip--selected', tone && `chip--${tone}`].filter(Boolean).join(' ')
  if (!onClick) return <span className={cls}>{children}</span>
  return (
    <button type="button" className={cls} aria-pressed={!!selected} onClick={onClick}>
      {children}
    </button>
  )
}

export function Stars({ rating }) {
  const full = Math.round(rating)
  return (
    <span className="stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {'★'.repeat(full)}
      <span className="stars__off">{'★'.repeat(5 - full)}</span>
    </span>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={value === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

// "< Title" bar used on pushed pages.
export function BackBar({ title, to, onBack }) {
  const navigate = useNavigate()
  const back = onBack ?? (() => (to ? navigate(to) : navigate(-1)))
  return (
    <header className="backbar">
      <button type="button" className="icon-btn backbar__back" onClick={back} aria-label="Back">
        <Icon name="back" />
      </button>
      {/* Like a phone's own back button, the title next to the arrow goes back too (the button is the
          accessible control; this is just a bigger place for a thumb to land). */}
      <h1 onClick={back}>{title}</h1>
    </header>
  )
}

// Eyebrow + big two-line title + small mascot, as on Discover, Saved, and Places I've tried.
export function Hero({ eyebrow, title, mascot, children }) {
  return (
    <header className="hero">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="title">{title}</h1>
        {children}
      </div>
      {mascot && <img className="hero__mascot" src={`/mascots/${mascot}.png`} alt="" />}
    </header>
  )
}

// Cards and lists show the photo's small copy, falling back to the full photo when there isn't one.
export function DishPhoto({ dish, className = '' }) {
  if (dish.photo) {
    const fit = dish.practice ? 'photo--whole' : ''
    return (
      <img
        className={`photo ${fit} ${className}`}
        src={dish.photoSmall ?? dish.photo}
        onError={fallBackTo(dish.photo)}
        alt={dish.name}
        loading="lazy"
      />
    )
  }
  return (
    <div className={`photo photo--empty ${className}`} role="img" aria-label={`${dish.name}, no photo yet`}>
      <Icon name="discover" size={36} />
      <span>No photo yet</span>
    </div>
  )
}

export function EmptyState({ mascot, framed, title, children, actions }) {
  return (
    <section className="empty">
      <div className={framed ? 'empty__art empty__art--framed' : 'empty__art'}>
        <img src={`/mascots/${mascot}.png`} alt="" />
      </div>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {actions && <div className="empty__actions">{actions}</div>}
    </section>
  )
}

export function Loader({ label = 'Finding your next happy bite…' }) {
  return (
    <section className="loader" role="status" aria-live="polite">
      <div className="loader__art">
        <img src="/mascots/orange-burst.png" alt="" />
      </div>
      <h2>{label}</h2>
      <div className="loader__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="muted small">A little patience. A lot of flavor.</p>
    </section>
  )
}

// The search field from Feed, also on My posts and My reviews.
export function SearchBox({ value, onChange, placeholder = 'Search dish or restaurant', label = 'Search' }) {
  return (
    <label className="search">
      <Icon name="search" />
      <span className="sr-only">{label}</span>
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function PostDeleted() {
  return (
    <EmptyState
      mascot={DELETED_MASCOT}
      title="This post was deleted"
      actions={
        <Link to="/" className="btn btn--gold btn--block">
          Back to Discover
        </Link>
      }
    >
      Its poster took it down, so it's no longer on ZotMunch.
    </EmptyState>
  )
}

// Postgres error codes whose raw message means nothing to a student.
const FRIENDLY_ERRORS = {
  22003: 'That price is too high. Enter a price up to $9,999.99.', // numeric overflow: price is numeric(6,2)
  moderation_unavailable: "We couldn't check your post right now. Try again, or save a draft.",
  moderation_busy: 'Too many checks in a short time. Try again in a bit.',
  ZM001: 'Please check your post again before publishing.', // the database found a photo with no passed check
  ZM002: 'Please check your post again before publishing.', // …or text with no passed check
}

export function ErrorNote({ error }) {
  if (!error) return null
  return (
    <p className="error" role="alert">
      {FRIENDLY_ERRORS[error.code] ?? error.message ?? String(error)}
    </p>
  )
}
