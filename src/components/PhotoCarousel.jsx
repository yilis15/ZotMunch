// Dish photos you can swipe through: native scroll-snap for touch, arrows and keys for mouse users,
// dots and an "n / total" counter, and optional thumbnails that jump to a photo.
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { DishPhoto } from './ui'

export default function PhotoCarousel({ dish, className = '', thumbnails = true }) {
  const track = useRef(null)
  const [index, setIndex] = useState(0)
  const photos = dish.photos ?? []

  // Keep the dots in step with however the user scrolled (finger, trackpad, or arrows).
  useEffect(() => {
    const el = track.current
    if (!el) return undefined
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [photos.length])

  if (photos.length < 2) return <DishPhoto dish={dish} className={className} />

  const go = (i) => {
    const el = track.current
    const next = Math.max(0, Math.min(photos.length - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(index - 1)
    else if (e.key === 'ArrowRight') go(index + 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="carousel-wrap">
      <div className={`carousel ${className}`}>
        <div
          ref={track}
          className="carousel__track"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${dish.name} photos`}
          onKeyDown={onKeyDown}
        >
          {photos.map((p, i) => (
            <img
              key={p.id ?? p.url}
              className="carousel__slide"
              src={p.url}
              alt={`${dish.name}, photo ${i + 1} of ${photos.length}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          ))}
        </div>

        <span className="carousel__count" aria-hidden="true">
          {index + 1} / {photos.length}
        </span>
        {index > 0 && (
          <button type="button" className="carousel__arrow carousel__arrow--prev" onClick={() => go(index - 1)} aria-label="Previous photo">
            <Icon name="back" size={20} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button type="button" className="carousel__arrow carousel__arrow--next" onClick={() => go(index + 1)} aria-label="Next photo">
            <Icon name="chevron" size={20} />
          </button>
        )}
        <div className="carousel__dots" aria-hidden="true">
          {photos.map((p, i) => (
            <span key={p.id ?? p.url} className={i === index ? 'is-active' : ''} />
          ))}
        </div>
      </div>

      {thumbnails && (
        <div className="thumbs thumbs--strip">
          {photos.map((p, i) => (
            <button
              key={p.id ?? p.url}
              type="button"
              className={i === index ? 'thumb is-active' : 'thumb'}
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index || undefined}
            >
              <img src={p.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
