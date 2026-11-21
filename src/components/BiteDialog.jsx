// The gold-edged dialog about one bite (leave Post, delete a draft, a post the content check stopped):
// a mascot peeking over the top (or, with `hero`, a larger round picture badge), a title, a line of text,
// a preview of the bite (or the caller's `detail` instead), and the caller's buttons. Escape or a tap
// outside cancels, except while `busy`.
import { useEffect } from 'react'
import Icon from './Icon'

export default function BiteDialog({ mascot, hero, title, body, detail, photo, name, restaurant, busy, onCancel, children }) {
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
        className={hero ? 'bite-dialog bite-dialog--hero' : 'bite-dialog'}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bite-dialog-title"
        aria-describedby="bite-dialog-body"
        onClick={(e) => e.stopPropagation()}
      >
        {hero ? (
          <span className="bite-dialog__mascot bite-dialog__mascot--badge" aria-hidden="true">
            <img src={hero} alt="" />
          </span>
        ) : (
          <span className="bite-dialog__mascot" aria-hidden="true">
            <img src={`/mascots/${mascot}.png`} alt="" />
          </span>
        )}
        <h2 id="bite-dialog-title" className="bite-dialog__title">
          {title}
        </h2>
        <p id="bite-dialog-body" className="bite-dialog__body">
          {body}
        </p>

        {detail ?? (
          <div className="bite-dialog__bite">
            {photo ? (
              <img className="bite-dialog__photo" src={photo} alt="" />
            ) : (
              <span className="bite-dialog__photo bite-dialog__photo--empty" aria-hidden="true">
                <Icon name="photo" size={22} />
              </span>
            )}
            <span className="bite-dialog__bite-text">
              <strong className={name ? '' : 'bite-dialog__placeholder'}>{name || 'Untitled bite'}</strong>
              <span className={restaurant ? 'meta' : 'meta bite-dialog__placeholder'}>{restaurant || 'No restaurant yet'}</span>
            </span>
          </div>
        )}

        <div className="bite-dialog__actions">{children}</div>
      </div>
    </div>
  )
}
