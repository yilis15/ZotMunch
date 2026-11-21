// "Pick for me" on Saved: a slot-machine reel spins through the saved dishes, slows down, and lands on one
// picked at random (bounce, confetti), then shows it with View dish / Spin again. Nothing is written.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BiteDialog from './BiteDialog'
import { priceLabel } from '../lib/discover'
import { formatMiles } from '../lib/location'
import { fallBackTo } from '../lib/photo'
import { savedByText } from '../lib/lists'

const ROW = 72 // px per reel row; the window shows three, the middle one is the pick
const STRIP = 30 // rows the reel runs through
const SPIN_MS = 2600
const CONFETTI = 24
const CONFETTI_COLORS = ['var(--gold)', 'var(--blue)', 'var(--orange)', '#8fc3e6']

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function randomInt(n) {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] % n
}

// A fresh pick (never the same dish twice in a row when there's a choice) and the reel that lands on it:
// random dishes, the pick second to last so it has a neighbour above and below when it stops.
function newSpin(saves, lastId) {
  const pool = saves.length > 1 ? saves.filter((s) => s.id !== lastId) : saves
  const winner = pool[randomInt(pool.length)]
  // No dish twice in a row on the reel (when there's more than one), so each row looks like a new spin.
  const strip = []
  for (let i = 0; i < STRIP; i++) {
    if (i === STRIP - 2) {
      strip.push(winner)
      continue
    }
    const avoid = new Set([strip[i - 1]?.id, i === STRIP - 3 || i === STRIP - 1 ? winner.id : null])
    const choices = saves.filter((s) => !avoid.has(s.id))
    strip.push(choices.length ? choices[randomInt(choices.length)] : saves[randomInt(saves.length)])
  }
  return { winner, strip, key: Math.random() }
}

function Thumb({ dish, className }) {
  return dish.photo ? (
    <img className={className} src={dish.photoSmall ?? dish.photo} onError={fallBackTo(dish.photo)} alt="" draggable={false} />
  ) : (
    <span className={`${className} pick__thumb--empty`} aria-hidden="true" />
  )
}

function Confetti() {
  const [bits] = useState(() =>
    Array.from({ length: CONFETTI }, (_, i) => {
      const angle = (i / CONFETTI) * 2 * Math.PI + Math.random() * 0.4
      const dist = 90 + Math.random() * 70
      return {
        '--x': `${Math.cos(angle) * dist}px`,
        '--y': `${Math.sin(angle) * dist * 0.7 - 30}px`,
        '--r': `${Math.round(Math.random() * 540 - 270)}deg`,
        '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDelay: `${Math.round(Math.random() * 120)}ms`,
      }
    }),
  )
  return (
    <span className="pick__confetti" aria-hidden="true">
      {bits.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </span>
  )
}

export default function PickDialog({ saves, shared, userId, onClose }) {
  const navigate = useNavigate()
  const [spin, setSpin] = useState(() => newSpin(saves))
  const [done, setDone] = useState(false)
  const [blurred, setBlurred] = useState(false)
  const strip = useRef(null)
  const viewBtn = useRef(null)

  // Run the reel: jump back to the top without animating, then ease down to the pick.
  useLayoutEffect(() => {
    const el = strip.current
    if (!el) return undefined
    const target = `translateY(${-(STRIP - 3) * ROW}px)`
    setDone(false)
    if (reducedMotion()) {
      el.style.transition = 'none'
      el.style.transform = target
      const t = setTimeout(() => setDone(true), 300)
      return () => clearTimeout(t)
    }
    el.style.transition = 'none'
    el.style.transform = 'translateY(0)'
    void el.offsetHeight // apply the jump before the animated move
    el.style.transition = `transform ${SPIN_MS}ms cubic-bezier(.12,.8,.2,1)`
    el.style.transform = target
    setBlurred(true)
    const sharpen = setTimeout(() => setBlurred(false), SPIN_MS - 700)
    const stop = setTimeout(() => {
      setDone(true)
      navigator.vibrate?.(40)
    }, SPIN_MS)
    return () => {
      clearTimeout(sharpen)
      clearTimeout(stop)
    }
  }, [spin.key])

  useEffect(() => {
    if (done) viewBtn.current?.focus()
  }, [done])

  const again = useCallback(() => setSpin((s) => newSpin(saves, s.winner.id)), [saves])
  const { winner } = spin
  const dish = winner.dish
  const meta = [priceLabel(dish.price), formatMiles(dish.distance)].filter(Boolean).join(' · ')

  return (
    <BiteDialog
      mascot="cookie"
      title="Let fate pick!"
      body={done ? 'Your next bite is…' : 'Can’t decide? Spinning your list…'}
      onCancel={onClose}
      detail={
        <div className="pick">
          <div className={done ? 'pick__reel is-done' : 'pick__reel'}>
            <div ref={strip} className={blurred ? 'pick__strip is-blurred' : 'pick__strip'} aria-hidden="true">
              {spin.strip.map((s, i) => (
                <div key={i} className={i === STRIP - 2 ? 'pick__row pick__row--win' : 'pick__row'}>
                  <Thumb dish={s.dish} className="pick__thumb" />
                  <span className="pick__row-text">
                    <strong>{s.dish.name}</strong>
                    <span className="meta">{s.dish.restaurant.name}</span>
                  </span>
                </div>
              ))}
            </div>
            <span className="pick__window" aria-hidden="true" />
            {done && !reducedMotion() && <Confetti key={spin.key} />}
          </div>
          <p className="sr-only" aria-live="polite">
            {done ? `Picked: ${dish.name} at ${dish.restaurant.name}` : ''}
          </p>
          {done && (
            <div className="pick__result">
              <Thumb dish={dish} className="pick__result-photo" />
              <div className="pick__result-text">
                <strong>{dish.name}</strong>
                <span className="meta">{dish.restaurant.name}</span>
                {meta && <span className="meta">{meta}</span>}
                {shared && winner.savers.length > 0 && (
                  <span className="meta pick__saved-by">{savedByText(winner.savers, userId)}</span>
                )}
                <span className={winner.tried ? 'pick__status pick__status--tried' : 'pick__status'}>
                  {winner.tried ? 'Tried it ✓' : 'Not yet'}
                </span>
              </div>
            </div>
          )}
        </div>
      }
    >
      <button
        ref={viewBtn}
        type="button"
        className="btn btn--gold btn--block"
        disabled={!done}
        onClick={() => navigate(`/dish/${dish.id}`)}
      >
        View dish
      </button>
      <button type="button" className="btn btn--outline btn--block" disabled={!done} onClick={again}>
        Spin again
      </button>
      <button type="button" className="link-btn bite-dialog__stay" onClick={onClose}>
        Close
      </button>
    </BiteDialog>
  )
}
