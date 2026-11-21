// Swipe mode (Figma 04): drag or use ←/→ to skip or want; tap the card for details.
import { useCallback, useEffect, useRef, useState } from 'react'
import { DishChips, DishMeta, PricePill } from './DishCard'
import Icon from './Icon'
import { DishPhoto } from './ui'

const TAP_SLOP = 10 // a finger tap usually wobbles a few pixels; past this the gesture picks an axis
// Sideways wins unless the move is clearly up or down: a thumb sweeps in an arc, often steeper than 45°.
// Sideways when |dx| >= |dy| * SIDEWAYS_BIAS, i.e. within about 55° of horizontal.
const SIDEWAYS_BIAS = 0.7
// Feedback timing and look (Swipe Handoff v1.2). The gesture itself (above and below) is our own tuning.
const RETURN_MS = 180 // below the swipe distance: back to the middle
const EXIT_MS = 300 // a decision: off the screen
const PREVIEW_MS = 120 // a button or arrow key first shows the full feedback for this long
const REDUCED_EXIT_MS = 150 // with reduced motion the card only fades
const RETURN_EASE = 'cubic-bezier(.22,.68,.24,1)'
const EXIT_EASE = 'cubic-bezier(.4,0,.85,.4)'
const DEAD_ZONE = 8
const MAX_TINT = 0.42
const MAX_TILT = 8 // degrees
const PREVIEW_NUDGE = 24 // px the card moves while a button previews its choice
// How far a drag must go: a fifth of the card (about 68px on a phone), so a short swipe is enough and the
// finger stays clear of the screen edge, where phones start their own back gesture.
const swipeDistance = (cardWidth) => Math.min(90, Math.max(56, cardWidth * 0.2))
// A quick flick counts even when it's short.
const FLICK_SPEED = 0.35 // px per ms, over the last 100ms
const FLICK_MIN = 28
const FLICK_WINDOW_MS = 100

const pickAxis = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) * SIDEWAYS_BIAS ? 'x' : 'y')
// Past the swipe distance the card follows at half speed, so it feels "far enough" before the edge.
const resist = (moved, limit) =>
  Math.abs(moved) <= limit ? moved : Math.sign(moved) * (limit + (Math.abs(moved) - limit) / 2)
// How strongly to show a choice for a finger `moved` px sideways: 0 inside the dead zone, 1 at the swipe
// distance. The direction comes from the sign, so dragging back through the middle clears it.
function feedbackFor(moved, limit) {
  const progress = Math.max(0, Math.min(1, (Math.abs(moved) - DEAD_ZONE) / (limit - DEAD_ZONE)))
  return {
    progress,
    direction: progress === 0 ? null : moved < 0 ? 'skip' : 'want',
    ready: Math.abs(moved) >= limit,
  }
}

const CAPTION = {
  skip: ['Keep swiping left', 'Release to skip'],
  want: ['Keep swiping right', 'Release to save'],
}
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// `allow` limits which directions count (the guide teaches one at a time); a wrong one springs back.
export default function SwipeDeck({ dishes, onSkip, onWant, onOpen, toast, allow, hideHint }) {
  const [leaving, setLeaving] = useState(null) // 'left' | 'right'
  const [round, setRound] = useState(0) // new card each swipe, even when the same dish comes straight back
  const limit = useRef(swipeDistance(340))
  const start = useRef(null) // { x, y, axis: null | 'x' | 'y', samples: [{ x, t }] } while a finger is down
  const card = useRef(null)
  const tint = useRef(null)
  const choice = { skip: useRef(null), want: useRef(null) }
  const frame = useRef(0)
  const busy = useRef(false) // a choice is on its way: ignore more until the next card
  const top = dishes[0]
  const next = dishes[1]

  // While dragging, the card and its feedback are written straight to the page (once per frame), not
  // through React, so a finger move doesn't re-render the whole card. `offset` is where the card sits,
  // `moved` how far the finger went (they differ past the swipe distance), `ms`/`ease` the transition.
  const paint = useCallback((offset, moved, ms = 0, ease = RETURN_EASE) => {
    cancelAnimationFrame(frame.current)
    const el = card.current
    if (!el) return
    const { progress, direction, ready } = feedbackFor(moved, limit.current)
    const fade = ms ? `opacity ${ms}ms ease` : 'none'
    el.style.transition = ms ? `transform ${ms}ms ${ease}` : 'none'
    el.style.transform = reducedMotion()
      ? 'none'
      : `translateX(${offset}px) rotate(${Math.sign(moved) * MAX_TILT * progress}deg)`
    if (tint.current) {
      if (direction) tint.current.dataset.dir = direction
      tint.current.style.transition = fade
      tint.current.style.opacity = MAX_TINT * progress
    }
    for (const name of ['skip', 'want']) {
      const box = choice[name].current
      if (!box) continue
      box.style.transition = fade
      box.style.opacity = direction === name ? Math.min(1, 1.7 * progress) : 0
      box.lastChild.textContent = CAPTION[name][ready ? 1 : 0]
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the refs never change
  }, [])
  const springBack = useCallback(() => paint(0, 0, RETURN_MS), [paint])
  const lastOffset = useRef(0)

  // Off it goes: full feedback stays on while the card leaves (or, with reduced motion, fades).
  const leave = useCallback(
    (direction) => {
      const el = card.current
      const sign = direction === 'right' ? 1 : -1
      const reduced = reducedMotion()
      if (el) {
        paint(lastOffset.current, sign * limit.current) // full colour, sticker and "Release to …"
        el.style.transition = reduced ? `opacity ${REDUCED_EXIT_MS}ms ease` : `transform ${EXIT_MS}ms ${EXIT_EASE}`
        if (reduced) el.style.opacity = '0'
      }
      setLeaving(direction)
      setTimeout(
        () => {
          setLeaving(null)
          setRound((r) => r + 1)
          lastOffset.current = 0
          busy.current = false
          if (direction === 'right') onWant(top)
          else onSkip(top)
        },
        reduced ? REDUCED_EXIT_MS : EXIT_MS,
      )
    },
    [paint, top, onSkip, onWant],
  )

  // `preview`: from a button or arrow key, show the choice for a moment before the card leaves.
  const decide = useCallback(
    (direction, { preview = false } = {}) => {
      if (!top || busy.current) return
      if (allow && !allow.includes(direction)) {
        springBack()
        return
      }
      busy.current = true
      if (!preview) {
        leave(direction)
        return
      }
      const sign = direction === 'right' ? 1 : -1
      lastOffset.current = sign * PREVIEW_NUDGE
      paint(lastOffset.current, sign * limit.current, PREVIEW_MS)
      setTimeout(() => leave(direction), PREVIEW_MS)
    },
    [top, allow, springBack, leave, paint],
  )

  useEffect(() => {
    // ← skips and → wants, like a swipe. Holding a key down swipes once, not card after card.
    const onKey = (e) => {
      if (e.repeat || e.target.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowLeft') decide('left', { preview: true })
      if (e.key === 'ArrowRight') decide('right', { preview: true })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [decide])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // Phones decide on their own whether a touch scrolls the page, often before a pointer event can say
  // otherwise, and then cancel the drag. Touch events can stop that: once the gesture is sideways, every
  // touchmove is default-prevented so the page never starts scrolling; an up-or-down one is left alone and
  // scrolls natively. (Pointer events below still do the dragging, for touch and mouse alike.)
  const touchAt = useRef(null)
  useEffect(() => {
    const el = card.current
    if (!el) return undefined
    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchAt.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchMove = (e) => {
      const from = touchAt.current
      if (!from) return
      const s = start.current
      if (s && !s.axis) {
        const t = e.touches[0]
        const dx = t.clientX - from.x
        const dy = t.clientY - from.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= TAP_SLOP) {
          s.axis = pickAxis(dx, dy)
          dragged.current = true
        }
      }
      if (s?.axis === 'x' && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [top?.id, round])

  // Taps come through as the browser's own click, which already forgives finger wobble;
  // `dragged` drops the click that follows a real drag.
  // Once the finger has moved past TAP_SLOP the gesture locks to one axis: sideways drags the card,
  // clearly up or down is left to the page's scroll and never swipes, even if it drifts sideways later.
  const dragged = useRef(false)
  const onPointerDown = (e) => {
    if (busy.current) return
    start.current = { x: e.clientX, y: e.clientY, axis: null, samples: [{ x: e.clientX, t: e.timeStamp }] }
    dragged.current = false
    limit.current = swipeDistance(e.currentTarget.offsetWidth)
  }
  const onPointerMove = (e) => {
    const s = start.current
    if (!s) return
    const moved = e.clientX - s.x
    if (!s.axis) {
      const rise = e.clientY - s.y
      if (Math.max(Math.abs(moved), Math.abs(rise)) < TAP_SLOP) return
      s.axis = pickAxis(moved, rise)
      dragged.current = true
      // Capture only a sideways drag, so a mouse can leave the card while dragging.
      if (s.axis === 'x') e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (s.axis !== 'x') return
    s.samples = [...s.samples.filter((p) => e.timeStamp - p.t <= FLICK_WINDOW_MS), { x: e.clientX, t: e.timeStamp }]
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      lastOffset.current = resist(moved, limit.current)
      paint(lastOffset.current, moved)
    })
  }
  const onPointerUp = (e) => {
    const s = start.current
    if (!s) return
    start.current = null
    if (s.axis !== 'x') return
    // From the finger, not what's on screen: a quick flick lifts before the last frame is drawn.
    const moved = e.clientX - s.x
    const first = s.samples[0]
    const speed = (e.clientX - first.x) / Math.max(1, e.timeStamp - first.t)
    const far = limit.current
    if (moved > far || (moved >= FLICK_MIN && speed >= FLICK_SPEED)) decide('right')
    else if (moved < -far || (moved <= -FLICK_MIN && speed <= -FLICK_SPEED)) decide('left')
    else springBack()
  }
  // The browser took the gesture over (a scroll or a system swipe): put the card back.
  const onPointerCancel = () => {
    start.current = null
    springBack()
  }
  const onClick = () => {
    if (!dragged.current && !busy.current) onOpen(top)
  }

  const offset = leaving === 'right' ? 600 : leaving === 'left' ? -600 : 0
  const tilt = leaving ? Math.sign(offset) * MAX_TILT : 0

  return (
    <div className="deck">
      {!hideHint && (
        <p className="deck__hint muted small" aria-hidden="true">
          ← Skip · Tap for details · Want it →
        </p>
      )}
      <p className="deck__keys muted small" aria-hidden="true">
        Or use your keyboard: <kbd>←</kbd> Skip · <kbd>→</kbd> Want it
      </p>
      <div className="deck__stack">
        {next && (
          <article className="card swipe-card swipe-card--behind" aria-hidden="true">
            <DishPhoto dish={next} className="swipe-card__photo" />
          </article>
        )}
        <article
          key={`${top.id}-${round}`}
          ref={card}
          className="card swipe-card"
          style={{ transform: leaving && reducedMotion() ? 'none' : `translateX(${offset}px) rotate(${tilt}deg)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClick={onClick}
          aria-label={`${top.name} at ${top.restaurant.name}`}
        >
          {toast}
          <div ref={tint} className="swipe-card__tint" aria-hidden="true" />
          <div ref={choice.skip} className="swipe-card__choice swipe-card__choice--skip" aria-hidden="true">
            <img className="swipe-card__mascot" src="/mascots/swipe-skip.webp" alt="" draggable={false} />
            <span className="swipe-card__label">
              <Icon name="close" size={24} /> Skip
            </span>
            <span className="swipe-card__caption">{CAPTION.skip[0]}</span>
          </div>
          <div ref={choice.want} className="swipe-card__choice swipe-card__choice--want" aria-hidden="true">
            <img className="swipe-card__mascot" src="/mascots/swipe-want.webp" alt="" draggable={false} />
            <span className="swipe-card__label">
              <span aria-hidden="true">♥</span> Want it
            </span>
            <span className="swipe-card__caption">{CAPTION.want[0]}</span>
          </div>
          {top.practice && <span className="practice-tag">Practice</span>}
          <DishPhoto dish={top} className="swipe-card__photo" />
          <div className="swipe-card__body">
            <div className="swipe-card__titlerow">
              <h2 className="title" title={top.name}>
                {top.name}
              </h2>
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
        <button type="button" className="btn btn--outline" data-tour="skip" onClick={() => decide('left', { preview: true })}>
          × Skip
        </button>
        <button type="button" className="btn btn--soft" data-tour="view" onClick={() => onOpen(top)}>
          View dish
        </button>
        <button type="button" className="btn btn--gold" data-tour="want" onClick={() => decide('right', { preview: true })}>
          <span aria-hidden="true">❤️</span> Want it
        </button>
      </div>
    </div>
  )
}
