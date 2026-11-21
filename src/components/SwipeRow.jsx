// A list row that slides right to reveal Remove (Saved). The parent decides which row is open.
import { useRef, useState } from 'react'

const REVEAL = 96 // width of the Remove button
const TAP_SLOP = 12

export default function SwipeRow({ open, onOpenChange, onRemove, disabled, label, children }) {
  const [dx, setDx] = useState(null) // live offset while dragging, else null
  const start = useRef(null)
  const dragged = useRef(false)
  const base = open ? REVEAL : 0

  const onPointerDown = (e) => {
    if (disabled || e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, base }
    dragged.current = false
  }
  const onPointerMove = (e) => {
    if (!start.current) return
    const moved = e.clientX - start.current.x
    if (!dragged.current) {
      if (Math.abs(moved) < TAP_SLOP) return
      // Mostly vertical: let the page scroll instead.
      if (Math.abs(e.clientY - start.current.y) > Math.abs(moved)) {
        start.current = null
        return
      }
      dragged.current = true
      // Capture only once it's a drag, so plain taps still reach the links inside.
      e.currentTarget.setPointerCapture(e.pointerId)
      if (!open) onOpenChange(true) // closes any other open row
    }
    setDx(Math.max(0, Math.min(REVEAL * 1.5, start.current.base + moved)))
  }
  const onPointerUp = () => {
    if (!start.current) return
    start.current = null
    if (dragged.current) onOpenChange(dx != null && dx > REVEAL / 2)
    setDx(null)
  }
  // Swallow the click that ends a drag; a tap on an open row just closes it.
  const onClickCapture = (e) => {
    if (dragged.current || open) {
      e.preventDefault()
      e.stopPropagation()
      if (!dragged.current) onOpenChange(false)
    }
    dragged.current = false
  }

  return (
    <div className={open ? 'swipe-row swipe-row--open' : 'swipe-row'}>
      <button
        type="button"
        className="swipe-row__remove"
        onClick={onRemove}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        aria-label={`Remove ${label}`}
      >
        Remove
      </button>
      <div
        className="swipe-row__content"
        style={{
          transform: `translateX(${dx ?? base}px)`,
          transition: dx == null ? 'transform 0.2s ease-out' : 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()} // a mouse drag on a link or photo should swipe, not drag it
      >
        {children}
      </div>
    </div>
  )
}
