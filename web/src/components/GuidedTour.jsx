import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TourContext } from '../lib/tour'
import '../styles/tour.css'

const STEPS = [
  ['Find your next bite', 'Discover dishes loved by fellow Anteaters.', '.nav__item[href="/"]'],
  ['Swipe left to pass', 'Not your craving? Swipe left or tap × Skip.', '.swipe-card:not(.swipe-card--behind)', '[data-tour="skip"]'],
  ['Swipe right to save', 'Like this bite? Swipe right or tap ❤️ Want it.', '.swipe-card:not(.swipe-card--behind)', '[data-tour="want"]'],
  ['Take a closer look', 'Tap the dish or View dish for the full story.', '.swipe-card:not(.swipe-card--behind)', '[data-tour="view"]'],
  ['Make it your kind of bite', 'Filter by cuisine, budget, and distance.', '.filter-group'],
  ['Share a happy bite', 'Add photos and tell Anteaters what you tried.', '[data-tour="photos"]'],
  ['Your food journal', 'Find your posts, reviews, and preferences here.', '.journal-card'],
]
const RESULTS = {
  skip: ['On to the next bite', "That bite was skipped. Here’s another option."],
  want: ['Saved for later!', 'Added to your food list. Find it in Saved.'],
  detail: ['The full story, right here', 'See the price, restaurant, and student reviews.'],
}

export default function GuidedTour({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const lastPath = useRef(pathname)
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const previousFocus = useRef(null)
  const autoStarted = useRef(false)
  const start = useCallback(() => {
    previousFocus.current = document.activeElement
    autoStarted.current = true
    setResult(null)
    setStep(0)
    navigate('/')
    window.scrollTo(0, 0)
  }, [navigate])
  useEffect(() => {
    if (autoStarted.current || step !== null || pathname !== '/') return
    const timer = setTimeout(start, 700)
    return () => clearTimeout(timer)
  }, [pathname, start, step])

  const exit = useCallback(() => {
    setStep(null)
    setResult(null)
    requestAnimationFrame(() => {
      const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector('[data-tour="restart"]')
      target?.focus({ preventScroll: true })
    })
  }, [])
  const go = (next) => {
    if (next > 6) { exit(); return }
    setResult(null)
    setStep(next)
    navigate(next === 5 ? '/post' : next === 6 ? '/me' : next === 4 ? '/?filters=1' : '/')
    window.scrollTo(0, 0)
  }
  const practice = (action) => {
    if ((step === 1 && action === 'skip') || (step === 2 && action === 'want') || (step === 3 && action === 'detail')) setResult(action)
  }
  // Browser navigation should never leave a tooltip over an unrelated page.
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    if (step === null) return
    const expected = step === 5 ? '/post' : step === 6 ? '/me' : '/'
    if (pathname !== expected && !(step === 3 && pathname.startsWith('/dish/') && !pathname.endsWith('/review'))) exit()
  }, [pathname, step, exit])

  return <TourContext.Provider value={{ step, result, start, exit, practice }}>
    <div className={step !== null ? 'tour-host tour-host--active' : 'tour-host'}>{children}</div>
    {step !== null && <Spotlight key={`${step}-${result}`} step={step} result={result} onBack={() => go(Math.max(0, step - 1))} onNext={() => go(step + 1)} onExit={exit} />}
  </TourContext.Provider>
}

function Spotlight({ step, result, onBack, onNext, onExit }) {
  const [layout, setLayout] = useState(null)
  const card = useRef(null)
  const mask = useId().replaceAll(':', '')
  const info = RESULTS[result] || STEPS[step]
  const selectors = result === 'detail' ? ['[data-tour="identity"]', '.review-card'] : result ? ['.swipe-card:not(.swipe-card--behind)'] : STEPS[step].slice(2)
  const selectorKey = selectors.join(',')

  useEffect(() => {
    let frame
    let stopped = false
    const measure = () => {
      if (stopped) return
      const elements = selectorKey.split(',').map(s => document.querySelector(s)).filter(Boolean)
      const width = window.innerWidth, height = window.innerHeight
      const rects = elements.map(el => {
        const r = el.getBoundingClientRect()
        return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 }
      }).filter(r => r.width > 16 && r.height > 16)
      const cardWidth = Math.min(342, width - 32)
      const cardHeight = card.current?.offsetHeight || 186
      const first = rects[0]
      let left = Math.max(16, Math.min(width - cardWidth - 16, first ? first.x + first.width / 2 - cardWidth / 2 : width / 2 - cardWidth / 2))
      let top, above = false
      if (step >= 1 && step <= 3 && !result) {
        // Reserve space above the card on small screens while retaining the real page layout.
        top = Math.max(12, (first?.y || 240) - cardHeight - 16)
        above = true
      } else if (first && first.y + first.height + cardHeight + 20 < height) {
        top = first.y + first.height + 20
      } else {
        top = Math.max(12, (first?.y || height) - cardHeight - 20)
        above = true
      }
      top = Math.max(12, Math.min(height - cardHeight - 12, top))
      const next = { rects, left, top, above, width: cardWidth, pointer: Math.max(22, Math.min(cardWidth - 22, first ? first.x + first.width / 2 - left : cardWidth / 2)) }
      setLayout(old => JSON.stringify(old) === JSON.stringify(next) ? old : next)
      frame = requestAnimationFrame(measure)
    }
    frame = requestAnimationFrame(measure)
    return () => { stopped = true; cancelAnimationFrame(frame) }
  }, [selectorKey, step, result])

  useEffect(() => {
    card.current?.querySelector('[data-next]')?.focus({ preventScroll: true })
    const keydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onExit() }
      if (e.key !== 'Tab') return
      const practice = selectorKey.split(',').flatMap(s => [...document.querySelectorAll(`${s} button, ${s} input, ${s} a, ${s}[tabindex], ${s}:is(button,a)`)]).filter(el => !el.disabled)
      const controls = [...(card.current?.querySelectorAll('button:not(:disabled)') || []), ...practice]
      const current = controls.indexOf(document.activeElement)
      const next = e.shiftKey ? (current <= 0 ? controls.length - 1 : current - 1) : (current + 1) % controls.length
      e.preventDefault(); controls[next]?.focus()
    }
    document.addEventListener('keydown', keydown, true)
    return () => document.removeEventListener('keydown', keydown, true)
  }, [onExit, selectorKey])

  return <div className="tour-layer">
    <svg className="tour-scrim" width="100%" height="100%" aria-hidden="true">
      <defs><mask id={mask}><rect width="100%" height="100%" fill="white" />{layout?.rects.map((r,i) => <rect key={i} {...r} rx="20" fill="black" />)}</mask></defs>
      <rect width="100%" height="100%" fill="#002244" opacity=".65" mask={`url(#${mask})`} />
      {/* The painted path blocks clicks outside the spotlight, while its holes allow practice. */}
      <path fill="transparent" fillRule="evenodd" pointerEvents="fill" d={`M0 0H${window.innerWidth}V${window.innerHeight}H0Z ${layout?.rects.map(r => `M${r.x} ${r.y}h${r.width}v${r.height}h${-r.width}Z`).join(' ') || ''}`} />
    </svg>
    {layout?.rects.map((r,i) => <div key={i} className="tour-ring" style={{ left:r.x, top:r.y, width:r.width, height:r.height }} />)}
    {!result && (step === 1 || step === 2) && layout?.rects[0] && <span className={`tour-cue ${step === 2 ? 'tour-cue--right' : ''}`} style={{ left:layout.rects[0].x + layout.rects[0].width / 2 - 82, top:layout.rects[0].y + 100 }}>{step === 1 ? '← Swipe left' : 'Swipe right →'}</span>}
    <section ref={card} role="dialog" aria-labelledby="tour-title" aria-describedby="tour-body" className="tour-card" style={{ left:layout?.left ?? 16, top:layout?.top ?? 16, width:layout?.width ?? 'calc(100% - 32px)', visibility:layout ? 'visible' : 'hidden' }}>
      <header><img src="/tour/guide.png" alt="" width="44" height="44" /><h2 id="tour-title">{info[0]}</h2></header>
      <p id="tour-body" aria-live="polite">{info[1]}</p>
      <footer><span>{step + 1}/7</span><button onClick={onBack} disabled={step === 0}>Back</button><button data-next className="tour-next" onClick={onNext}>{step === 6 ? 'Let’s eat!' : 'Next'}</button><button className="tour-skip" onClick={onExit}>Skip tour</button></footer>
      <img className={`tour-pointer ${layout?.above ? 'tour-pointer--bottom' : ''}`} src="/tour/pointer.svg" alt="" style={{ left:(layout?.pointer || 32) - 8 }} />
    </section>
  </div>
}
