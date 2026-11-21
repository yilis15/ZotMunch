// First-time guide (Figma: ZotMunch · Guided Product Tour): a dimmed page with gold spotlights and a
// coachmark. Everything outside the current step is blocked, so nothing real gets posted or changed.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import { TOUR_STEPS, TOUR_TOTAL } from '../lib/tour'

const HOLE_PAD = 8
const POINTER_GAP = 16
const SCREEN_GAP = 8
const CARD_GUTTER = 24 // the coachmark's side margin on phones, when there's room for it
const POINTER_INSET = 24
const MISSING_TARGET_MS = 2000

const sameRects = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// One spotlight per target, or a single one around them all with `mergeTargets`.
function measure({ targets, mergeTargets }) {
  const rects = targets.flatMap((selector) => {
    const box = document.querySelector(selector)?.getBoundingClientRect()
    if (!box || !box.width) return []
    return [{ x: box.left - HOLE_PAD, y: box.top - HOLE_PAD, w: box.width + HOLE_PAD * 2, h: box.height + HOLE_PAD * 2 }]
  })
  if (!mergeTargets || !rects.length) return rects
  const x = Math.min(...rects.map((r) => r.x))
  const y = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.w))
  const bottom = Math.max(...rects.map((r) => r.y + r.h))
  return [{ x, y, w: right - x, h: bottom - y }]
}

// Steps that don't point at the tab bar hide it on phones (body.tour-hide-nav), which gives a short
// screen's spotlights its 72px back: on a 320×514 phone the Skip / View dish / Want it buttons sat behind it.
const usesNav = (step) => step.targets.some((selector) => selector.includes('.nav__item'))

// How far to scroll so the spotlights clear the bottom of the screen (or the tab bar, when it shows).
// When they can't all fit, a step with several keeps the last one in view (the buttons it asks you to
// tap) and lets the top of the first slide under the coachmark; a single spotlight keeps its top.
function scrollFor(step, rects) {
  if (step.fixedTarget) return 0
  const first = rects[0].y + window.scrollY
  const last = rects[rects.length - 1]
  const navTop = usesNav(step)
    ? (document.querySelector('.nav')?.getBoundingClientRect().top ?? window.innerHeight)
    : window.innerHeight
  const limit = navTop > window.innerHeight / 2 ? navTop : window.innerHeight
  const needed = last.y + last.h + window.scrollY - (limit - SCREEN_GAP)
  return Math.max(0, rects.length > 1 ? needed : Math.min(needed, first - SCREEN_GAP))
}

// Prefer the step's side of the first spotlight, flip if it doesn't fit, and stay on screen.
function placeCoachmark(first, place, width, height, avoid) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!first) return { left: (vw - width) / 2, top: (vh - height) / 2, pointer: null }
  const above = first.y - POINTER_GAP - height
  const below = first.y + first.h + POINTER_GAP
  const fitsAbove = above >= SCREEN_GAP
  const fitsBelow = below + height <= vh - SCREEN_GAP
  const useAbove = place === 'above' ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove
  const center = first.x + first.w / 2
  const gutter = Math.max(SCREEN_GAP, Math.min(CARD_GUTTER, (vw - width) / 2))
  const left = Math.min(Math.max(gutter, center - width / 2), vw - width - gutter)
  const top = Math.min(Math.max(SCREEN_GAP, useAbove ? above : below), vh - height - SCREEN_GAP)
  const pointerX = Math.min(Math.max(POINTER_INSET, center - left), width - POINTER_INSET)
  // Move off something the step wants visible, if there's room below it. The pointer no longer lines up, so it goes.
  if (avoid) {
    const overlaps = left < avoid.right && left + width > avoid.left && top < avoid.bottom && top + height > avoid.top
    const clearTop = avoid.bottom + POINTER_GAP
    if (overlaps && clearTop + height <= vh - SCREEN_GAP) return { left, top: clearTop, pointer: null }
  }
  return { left, top, pointer: { side: useAbove ? 'bottom' : 'top', x: pointerX } }
}

// Figma 02 · Swipe your way: swipe the card on a phone, or press ← → on a computer.
function DeviceLesson({ title }) {
  return (
    <>
      <h2 className="tour-card__title">{title}</h2>
      <div className="tour-devices">
        <figure className="tour-device">
          <figcaption>Phone</figcaption>
          <img src="/tour/phone-swipe.svg" alt="A finger swiping a phone left or right" width="112" height="128" />
          <p>Swipe</p>
        </figure>
        <figure className="tour-device">
          <figcaption>Computer</figcaption>
          <img src="/tour/keyboard-arrows.svg" alt="A keyboard with the left and right arrow keys" width="112" height="128" />
          <p>Use ← →</p>
        </figure>
      </div>
    </>
  )
}

export default function ProductTour() {
  const { tourPhase, setTourPhase, endTour } = useApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const step = TOUR_STEPS[tourPhase]
  const [rects, setRects] = useState([])
  const [gaveUp, setGaveUp] = useState(false)
  const [spot, setSpot] = useState(null)
  const [viewport, setViewport] = useState(0) // bumps when the phone's address bar resizes the screen
  const card = useRef(null)
  const nextBtn = useRef(null)
  const scrolled = useRef(null)

  // Keep to this step's page, even after the browser's Back button.
  useEffect(() => {
    if (step && pathname !== step.route) navigate(step.route, { replace: true })
  }, [step, pathname, navigate])

  // Follow the spotlight targets as pages load and scroll.
  useEffect(() => {
    if (!step) return undefined
    let frame
    const tick = () => {
      const next = measure(step)
      setRects((prev) => (sameRects(prev, next) ? prev : next))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [step])

  useEffect(() => {
    setGaveUp(false)
    if (!step) return undefined
    const timer = setTimeout(() => setGaveUp(true), MISSING_TARGET_MS)
    return () => clearTimeout(timer)
  }, [step])

  // A step with nothing to spotlight (Swipe your way) shows its card at once, centered.
  const ready = rects.length > 0 || gaveUp || !step?.targets.length

  // Bring the step into view once, when its first target appears.
  // Measured fresh: `rects` still holds the previous step on the render that changes step.
  useEffect(() => {
    if (!tourPhase || scrolled.current === tourPhase) return
    const fresh = measure(step)
    if (!fresh.length) return
    scrolled.current = tourPhase
    window.scrollTo(0, scrollFor(step, fresh))
  }, [tourPhase, step, rects])

  useLayoutEffect(() => {
    if (!step || !ready || !card.current) return
    const { offsetWidth, offsetHeight } = card.current
    const avoid = step.avoid && document.querySelector(step.avoid)?.getBoundingClientRect()
    const next = placeCoachmark(rects[0], step.place, offsetWidth, offsetHeight, avoid)
    setSpot((prev) => (sameRects(prev, next) ? prev : next))
  }, [step, rects, ready, pathname, viewport])

  // If the visible screen still changes size (the address bar shows or hides), place the card again.
  useEffect(() => {
    const vv = window.visualViewport
    if (!step || !vv) return undefined
    const onResize = () => setViewport((n) => n + 1)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [step])

  useEffect(() => {
    if (ready) nextBtn.current?.focus({ preventScroll: true })
  }, [ready, tourPhase])

  // While the guide is open the page can't scroll, and the only things that respond are the coachmark and what the step allows.
  // Phones don't fully honor overflow: hidden, so a drag could still nudge the page and slide the address bar,
  // which leaves fixed elements drawn in one place but tapped in another (Next's tap area ended up above it).
  // So touchmove is cancelled too: the page never moves, and the practice card still drags (pointer events).
  useEffect(() => {
    if (!step) return undefined
    const allowed = (target) =>
      target.closest?.('.tour-card') || step.allow?.some((selector) => target.closest?.(selector))
    const guardPointer = (e) => {
      if (allowed(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const guardKey = (e) => {
      if (e.key === 'Tab') {
        const items = [...(card.current?.querySelectorAll('button:not(:disabled)') ?? [])]
        const at = items.indexOf(document.activeElement)
        e.preventDefault()
        e.stopPropagation()
        items[(at + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
        return
      }
      if (step.keys?.includes(e.key)) return
      if (e.target.closest?.('.tour-card') && (e.key === 'Enter' || e.key === ' ')) return
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('click', guardPointer, true)
    document.addEventListener('pointerdown', guardPointer, true)
    document.addEventListener('keydown', guardKey, true)
    const stopScroll = (e) => e.cancelable && e.preventDefault()
    document.addEventListener('touchmove', stopScroll, { passive: false, capture: true })
    document.documentElement.classList.add('tour-open')
    document.body.classList.add('no-scroll', 'tour-open')
    document.body.classList.toggle('tour-hide-nav', step.targets.length > 0 && !usesNav(step))
    return () => {
      document.removeEventListener('click', guardPointer, true)
      document.removeEventListener('pointerdown', guardPointer, true)
      document.removeEventListener('keydown', guardKey, true)
      document.removeEventListener('touchmove', stopScroll, { capture: true })
      document.documentElement.classList.remove('tour-open')
      document.body.classList.remove('no-scroll', 'tour-open', 'tour-hide-nav')
    }
  }, [step])

  if (!step) return null

  const finish = () => {
    navigate('/', { replace: true })
    endTour()
  }
  const first = rects[0]

  return (
    <div className="tour">
      <svg className="tour__scrim" aria-hidden="true">
        <defs>
          <mask id="tour-holes">
            <rect width="100%" height="100%" fill="white" />
            {rects.map((r) => (
              <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={r.h} rx="20" fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#tour-holes)" />
      </svg>

      {rects.map((r) => (
        <div key={`${r.x}-${r.y}`} className="tour__ring" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
      ))}

      {step.cue && first && (
        <div className={`tour__cue tour__cue--${step.cue}`} style={{ left: first.x + first.w / 2, top: first.y + 96 }} aria-hidden="true">
          {step.cue === 'left' ? '← Swipe left' : 'Swipe right →'}
        </div>
      )}

      {ready && (
        <div
          ref={card}
          className={step.devices ? 'tour-card tour-card--devices' : 'tour-card'}
          role="group"
          aria-live="polite"
          aria-label={`Guide, step ${step.n} of ${TOUR_TOTAL}`}
          style={spot ? { left: spot.left, top: spot.top } : { visibility: 'hidden' }}
        >
          {step.devices ? (
            <DeviceLesson title={step.title} />
          ) : (
            <>
              <div className="tour-card__head">
                <img src="/mascots/cookie.png" alt="" />
                <h2>{step.title}</h2>
              </div>
              <p className="tour-card__body">{step.body}</p>
            </>
          )}
          <div className="tour-card__controls">
            <span className="tour-card__count">
              {step.n}/{TOUR_TOTAL}
            </span>
            <button type="button" className="tour-btn tour-btn--back" disabled={!step.back} onClick={() => setTourPhase(step.back)}>
              Back
            </button>
            <button
              ref={nextBtn}
              type="button"
              className="tour-btn tour-btn--next"
              onClick={() => (step.next ? setTourPhase(step.next) : finish())}
            >
              {step.nextLabel ?? 'Next'}
            </button>
            <button type="button" className="tour-btn tour-btn--skip" onClick={finish}>
              Skip tour
            </button>
          </div>
          {spot?.pointer && (
            <span className={`tour-card__pointer tour-card__pointer--${spot.pointer.side}`} style={{ left: spot.pointer.x }} aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  )
}
