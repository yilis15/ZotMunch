// Small shared pieces from the Figma working kit.
import { useNavigate } from 'react-router-dom'
import Icon, { Chili } from './Icon'

export function Chip({ selected, tone, onClick, children }) {
  const cls = ['chip', selected && 'chip--selected', tone && `chip--${tone}`].filter(Boolean).join(' ')
  if (!onClick) return <span className={cls}>{children}</span>
  return (
    <button type="button" className={cls} aria-pressed={!!selected} onClick={onClick}>
      {children}
    </button>
  )
}

export function SpiceLevel({ level }) {
  if (!level) return null
  return (
    <span className="spice" title={`Spice level ${level} of 3`} aria-label={`Spice level ${level} of 3`}>
      {Array.from({ length: level }, (_, i) => (
        <Chili key={i} />
      ))}
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
export function BackBar({ title, to }) {
  const navigate = useNavigate()
  return (
    <header className="backbar">
      <button type="button" className="icon-btn" onClick={() => (to ? navigate(to) : navigate(-1))} aria-label="Back">
        <Icon name="back" />
      </button>
      <h1>{title}</h1>
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

export function DishPhoto({ dish, className = '' }) {
  if (dish.photo) return <img className={`photo ${className}`} src={dish.photo} alt={dish.name} loading="lazy" />
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

export function ErrorNote({ error }) {
  if (!error) return null
  return (
    <p className="error" role="alert">
      {error.message ?? String(error)}
    </p>
  )
}
