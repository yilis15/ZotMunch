// "Delete this post?" (Figma: My posts · Confirm): a centered card over the dimmed page.
// Escape or a tap outside cancels; the danger button stays disabled while the delete runs.
import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  title,
  body = "This can't be undone.",
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  confirmDisabled,
  busy,
  onConfirm,
  onCancel,
  children,
}) {
  const cancelBtn = useRef(null)

  // The safe choice gets the focus once, when the dialog opens. (Doing it on every render would pull the
  // focus out of a field inside the dialog, such as the list name typed to confirm a delete.)
  useEffect(() => cancelBtn.current?.focus(), [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [busy, onCancel])

  return (
    <div className="confirm-backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="title title--sm">
          {title}
        </h2>
        <p id="confirm-body" className="muted">
          {body}
        </p>
        {children}
        <div className="confirm__actions">
          <button ref={cancelBtn} type="button" className="btn btn--outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy || confirmDisabled}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
