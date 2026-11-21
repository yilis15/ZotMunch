// The shared-list panels (Save to, Share, Create list, Saved by, Add from My Saves): a sheet that slides
// up from the bottom on phones and sits in the middle on wide screens, like DuplicateSheet. Escape, the
// close button or a tap outside closes it (not while `busy`); focus returns to whatever opened it.
import { useEffect, useId, useRef } from 'react'
import Icon from './Icon'

export default function Sheet({ title, subtitle, onClose, busy, footer, wide, children, labelClose = 'Close' }) {
  const id = useId()
  const panel = useRef(null)

  useEffect(() => {
    const opener = document.activeElement
    // A confirmation opened on top answers Escape itself.
    const onKey = (e) => e.key === 'Escape' && !busy && !document.querySelector('.confirm-backdrop') && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    panel.current?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [busy, onClose])

  return (
    <div className="sheet-backdrop sheet-backdrop--center" onClick={() => !busy && onClose()}>
      <div
        ref={panel}
        className={wide ? 'sheet sheet--lists sheet--wide' : 'sheet sheet--lists'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <div>
            <h2 id={`${id}-title`} className="title title--sm">
              {title}
            </h2>
            {subtitle && <p className="muted small">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn icon-btn--soft" onClick={onClose} disabled={busy} aria-label={labelClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__foot">{footer}</footer>}
      </div>
    </div>
  )
}
