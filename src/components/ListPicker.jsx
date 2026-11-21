// Saved's list switcher (spec 3.1): a button naming the open list, and a menu of MY LISTS, SHARED LISTS
// and INVITATIONS, ending with "+ Create shared list". Like SortMenu, the menu is drawn in a portal just
// below the button, as tall as the room above the phone's bottom navigation allows.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { listName, memberWord } from '../lib/lists'
import Icon from './Icon'

export default function ListPicker({ lists, current, invites = [], onPick, onInvite, onCreate }) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null)
  const button = useRef(null)
  const menu = useRef(null)

  const close = (refocus = true) => {
    setOpen(false)
    setPlace(null)
    if (refocus) button.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open) return undefined
    const measure = () => {
      const r = button.current.getBoundingClientRect()
      const nav = document.querySelector('.nav')
      const navTop = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : window.innerHeight
      const top = r.bottom + 8
      const bottom = Math.min(navTop, window.innerHeight) - 12
      setPlace({ top, left: r.left, width: Math.max(r.width, Math.min(360, window.innerWidth - r.left - 16)), maxHeight: Math.max(180, bottom - top) })
    }
    if (window.innerHeight - button.current.getBoundingClientRect().bottom < 320) {
      window.scrollBy(0, button.current.getBoundingClientRect().top - 90)
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
    menu.current?.querySelector('[aria-current="true"], button')?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = [...menu.current.querySelectorAll('button')]
        const at = items.indexOf(document.activeElement)
        items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, place])

  const personal = lists.filter((l) => l.kind === 'personal')
  const shared = lists.filter((l) => l.kind === 'shared')
  const pick = (fn) => () => {
    close(false)
    fn()
  }

  const row = (l) => (
    <button
      key={l.id}
      type="button"
      className="list-menu__item"
      aria-current={l.id === current?.id}
      onClick={pick(() => onPick(l.id))}
    >
      <span className="list-menu__icon" aria-hidden="true">
        {l.kind === 'personal' ? '♥' : '👥'}
      </span>
      <span className="list-menu__text">
        <strong>{listName(l)}</strong>
        <small>{l.kind === 'personal' ? 'Private · Just you' : memberWord(l.memberCount)}</small>
      </span>
      {l.id === current?.id && <Icon name="check" size={18} className="list-menu__check" />}
    </button>
  )

  return (
    <div className="list-picker">
      <button
        ref={button}
        type="button"
        className="list-picker__button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="list-menu__icon" aria-hidden="true">
          {current?.kind === 'shared' ? '👥' : '♥'}
        </span>
        <span className="list-picker__name">{listName(current)}</span>
        {invites.length > 0 && <span className="dot" aria-label={`${invites.length} invitation${invites.length === 1 ? '' : 's'}`} />}
        <Icon name="down" size={18} />
      </button>

      {open &&
        place &&
        createPortal(
          <>
            <div className="sort__scrim" onClick={() => close(false)} aria-hidden="true" />
            <div
              ref={menu}
              className="list-menu"
              role="menu"
              aria-label="Your lists"
              style={{ top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight }}
            >
              <p className="list-menu__group">My lists</p>
              {personal.map(row)}
              {shared.length > 0 && <p className="list-menu__group">Shared lists</p>}
              {shared.map(row)}
              {invites.length > 0 && <p className="list-menu__group">Invitations ({invites.length})</p>}
              {invites.map((inv) => (
                <button key={inv.listId} type="button" className="list-menu__item" onClick={pick(() => onInvite(inv))}>
                  <span className="list-menu__icon" aria-hidden="true">
                    ✉
                  </span>
                  <span className="list-menu__text">
                    <strong>{inv.name}</strong>
                    <small>From {inv.inviter?.name?.split(' ')[0] ?? 'someone'} · Review</small>
                  </span>
                </button>
              ))}
              <button type="button" className="list-menu__item list-menu__create" onClick={pick(onCreate)}>
                <span className="list-menu__icon" aria-hidden="true">
                  +
                </span>
                <span className="list-menu__text">
                  <strong>Create shared list</strong>
                </span>
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
