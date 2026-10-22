// Swipe mode (Figma 04): drag or use ←/→ to skip or want; tap the card for details.
import { useCallback, useEffect, useRef, useState } from 'react'
import { DishChips, DishMeta, PricePill } from './DishCard'
import { DishPhoto } from './ui'

const SWIPE_DISTANCE = 100
const TAP_SLOP = 12 // a finger tap usually wobbles a few pixels
const FLY_MS = 220

export default function SwipeDeck({ dishes, onSkip, onWant, onOpen, toast }) {
  const [dx, setDx] = useState(0)
  const [leaving, setLeaving] = useState(null) // 'left' | 'right'
  const start = useRef(null)
  const top = dishes[0]
  const next = dishes[1]

  const decide = useCallback(
    (direction) => {
      if (!top || leaving) return
      setLeaving(direction)
      setTimeout(() => {
        setLeaving(null)
        setDx(0)
        if (direction === 'right') onWant(top)
        else onSkip(top)
      }, FLY_MS)
    },
    [top, leaving, onSkip, onWant],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowLeft') decide('left')
      if (e.key === 'ArrowRight') decide('right')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [decide])

  // Taps come through as the browser's own click, which already forgives finger wobble;
  // `dragged` drops the click that follows a real drag.
  const dragged = useRef(false)
  const onPointerDown = (e) => {
    if (leaving) return
    start.current = e.clientX
    dragged.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (start.current == null) return
    const moved = e.clientX - start.current
    if (Math.abs(moved) > TAP_SLOP) dragged.current = true
    setDx(moved)
  }
  const onPointerUp = () => {
    if (start.current == null) return
    start.current = null
    if (dx > SWIPE_DISTANCE) decide('right')
    else if (dx < -SWIPE_DISTANCE) decide('left')
    else setDx(0)
  }
  const onClick = () => {
    if (!dragged.current && !leaving) onOpen(top)
  }

  const offset = leaving === 'right' ? 600 : leaving === 'left' ? -600 : dx
  const dragging = start.current != null

  return (
    <div className="deck">
      <p className="deck__hint muted small" aria-hidden="true">
        ← Skip · Tap for details · Want it →
      </p>
      <div className="deck__stack">
        {next && (
          <article className="card swipe-card swipe-card--behind" aria-hidden="true">
            <DishPhoto dish={next} className="swipe-card__photo" />
          </article>
        )}
        <article
          key={top.id}
          className="card swipe-card"
          style={{
            transform: `translateX(${offset}px) rotate(${offset / 20}deg)`,
            transition: dragging ? 'none' : `transform ${FLY_MS}ms ease-out`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          aria-label={`${top.name} at ${top.restaurant.name}`}
        >
          {toast}
          <span className="swipe-card__stamp swipe-card__stamp--want" style={{ opacity: Math.max(0, offset / SWIPE_DISTANCE) }}>
            Want it
          </span>
          <span className="swipe-card__stamp swipe-card__stamp--skip" style={{ opacity: Math.max(0, -offset / SWIPE_DISTANCE) }}>
            Skip
          </span>
          <DishPhoto dish={top} className="swipe-card__photo" />
          <div className="swipe-card__body">
            <div className="swipe-card__titlerow">
              <h2 className="title">{top.name}</h2>
            </div>
            <DishMeta dish={top} />
            <div className="dish-card__foot">
              <DishChips dish={top} />
              <PricePill price={top.price} size="lg" />
            </div>
          </div>
        </article>
      </div>
      <div className="deck__actions">
        <button type="button" className="btn btn--outline" onClick={() => decide('left')}>
          × Skip
        </button>
        <button type="button" className="btn btn--soft" onClick={() => onOpen(top)}>
          View dish
        </button>
        <button type="button" className="btn btn--gold" onClick={() => decide('right')}>
          <span aria-hidden="true">❤️</span> Want it
        </button>
      </div>
    </div>
  )
}
