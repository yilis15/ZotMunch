// Feed's Sort button and its menu (handoff "02 Feed 六种排序"): three groups of two orders. Picking one
// applies it and closes the menu; Escape, the close button or a tap outside closes without changing it.
// The menu is drawn over everything (in a portal, so the phone's bottom navigation can't cover it), just
// below the button and right-aligned with it, as tall as the room above the navigation allows.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SORTS } from '../lib/discover'
import Icon from './Icon'

const GROUPS = [...new Set(SORTS.map((s) => s.group))]

export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null) // { top, right, maxHeight } in the viewport
  const button = useRef(null)
  const menu = useRef(null)

  const close = (refocus = true) => {
    setOpen(false)
    setPlace(null)
    if (refocus) button.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open) return undefined
    // Too little room below the button (the page is scrolled down): bring it near the top first.
    const room = () => window.innerHeight - button.current.getBoundingClientRect().bottom
    if (room() < 540) window.scrollBy(0, button.current.getBoundingClientRect().top - 90)
    const measure = () => {
      const r = button.current.getBoundingClientRect()
      const nav = document.querySelector('.nav')
      const navTop = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : window.innerHeight
      const bottom = Math.min(navTop, window.innerHeight) - 12
      const top = r.bottom + 10
      setPlace({ top, right: window.innerWidth - r.right, maxHeight: Math.max(160, bottom - top) })
    }
    measure()
    window.addEventListener('resize', measure)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('resize', measure)
      document.body.classList.remove('no-scroll')
    }
  }, [open])

  useEffect(() => {
    if (!open || !place) return undefined
    menu.current?.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setPlace(null)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, place])

  // Arrow keys move between the six orders, like a radio group.
  const onOptionsKey = (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const options = [...menu.current.querySelectorAll('[role="radio"]')]
    const at = options.indexOf(document.activeElement)
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (at + keys[e.key] + options.length) % options.length
    options[next].focus()
  }

  return (
    <div className="sort">
      <button
        ref={button}
        type="button"
        className="sort__button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Icon name="sort" size={17} />
        Sort
        <Icon name="down" size={15} />
      </button>

      {open &&
        place &&
        createPortal(
          <>
            <div className="sort__scrim" onClick={() => close(false)} aria-hidden="true" />
            <section
              ref={menu}
              className="sort__menu"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sort-title"
              style={{ top: place.top, right: place.right, maxHeight: place.maxHeight }}
            >
              <header className="sort__head">
                <div>
                  <p className="sort__eyebrow">Find your next bite</p>
                  <h2 id="sort-title" className="sort__title">
                    Sort dishes
                  </h2>
                </div>
                <button type="button" className="sort__close" onClick={() => close()} aria-label="Close sort options">
                  <Icon name="close" size={18} />
                </button>
              </header>
              <div role="radiogroup" aria-label="Sort dishes by" onKeyDown={onOptionsKey}>
                {GROUPS.map((group) => (
                  <div key={group} className="sort__group">
                    <h3 className="sort__group-title">{group}</h3>
                    {SORTS.filter((s) => s.group === group).map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        role="radio"
                        aria-checked={s.key === value}
                        tabIndex={s.key === value ? 0 : -1}
                        aria-label={`${group}: ${s.label}`}
                        className="sort__option"
                        onClick={() => {
                          close()
                          if (s.key !== value) onChange(s.key)
                        }}
                      >
                        <span className="sort__mark" aria-hidden="true">
                          {s.mark}
                        </span>
                        <span>{s.label}</span>
                        {s.key === value && <Icon name="check" size={17} className="sort__check" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className="sort__foot">Choose an order. We’ll take it from here.</p>
            </section>
          </>,
          document.body,
      )}
    </div>
  )
}
