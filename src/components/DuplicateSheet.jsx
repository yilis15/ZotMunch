// "Is this the same dish?" (Figma 12): the dish already exists at this restaurant.
import { useEffect } from 'react'
import Icon from './Icon'
import { DishPhoto } from './ui'

export default function DuplicateSheet({ dish, onReview, onKeepPosting }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onKeepPosting()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onKeepPosting])

  const { restaurant } = dish
  return (
    <div className="sheet-backdrop sheet-backdrop--center" onClick={onKeepPosting}>
      <div
        className="sheet sheet--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <h2 id="dup-title" className="title title--sm">
            Is this the same dish?
          </h2>
          <button type="button" className="icon-btn" onClick={onKeepPosting} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet__body stack">
          <div className="dish-summary card">
            <DishPhoto dish={dish} className="dish-summary__photo" />
            <div>
              <h3 className="title title--xs">{dish.name}</h3>
              <p className="meta">{restaurant.name}</p>
              <p className="meta">{restaurant.address}</p>
            </div>
          </div>
          <p className="muted small">Add your review and photos to the existing dish.</p>
          <button type="button" className="btn btn--blue btn--block" onClick={onReview}>
            Add my review
          </button>
          <button type="button" className="link-btn" onClick={onKeepPosting}>
            This is a different dish — keep posting
          </button>
        </div>
      </div>
    </div>
  )
}
