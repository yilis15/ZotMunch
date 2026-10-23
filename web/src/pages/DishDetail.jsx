// Dish details (Figma 07): photo, price, spice, restaurant, Want it, tags, and Anteater reviews.
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { getDish, getSaveStatus, recordSwipe, wantDish } from '../lib/api'
import { formatMiles } from '../lib/location'
import { FILTER_CATEGORIES } from '../lib/discover'
import { PricePill } from '../components/DishCard'
import Icon from '../components/Icon'
import { BackBar, Chip, DishPhoto, ErrorNote, Loader, SpiceLevel } from '../components/ui'

const TAG_GROUPS = [['dietary', 'Fits'], ['allergy', 'Contains'], ...FILTER_CATEGORIES]

function Stars({ rating }) {
  const full = Math.round(rating)
  return (
    <span className="stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {'★'.repeat(full)}
      <span className="stars__off">{'★'.repeat(5 - full)}</span>
    </span>
  )
}

export default function DishDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const { userId, tagsById } = useApp()
  const [dish, setDish] = useState(null)
  const [status, setStatus] = useState(undefined) // null = not saved
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    setDish(null)
    Promise.all([getDish(id), getSaveStatus(userId, id)])
      .then(([d, s]) => {
        if (!live) return
        setDish(d)
        setStatus(s)
      })
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [id, userId])

  // Opening a dish from Discover counts as a "view" swipe for that mode.
  // The ref keeps React's dev double-run of effects from logging it twice.
  const from = state?.from
  const logged = useRef(null)
  useEffect(() => {
    if ((from === 'swipe' || from === 'feed') && logged.current !== id) {
      logged.current = id
      recordSwipe(userId, id, 'view', from).catch(() => {})
    }
  }, [from, id, userId])

  const want = async () => {
    setStatus('not_yet')
    try {
      await wantDish(userId, id)
    } catch (e) {
      setStatus(null)
      setError(e)
    }
  }

  if (error) return <div className="page"><BackBar title="Dish details" /><ErrorNote error={error} /></div>
  if (!dish) return <Loader label="Plating it up…" />

  const { restaurant } = dish
  const tagNames = (category) =>
    dish.tagIds.map((t) => tagsById.get(t)).filter((t) => t?.category === category).map((t) => t.name)
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name} ${restaurant.address ?? ''} Irvine CA`,
  )}`

  return (
    <div className="page detail">
      <BackBar title="Dish details" />
      {state?.reviewPosted && (
        <p className="review-success" role="status">
          Thanks for sharing your bite! Your review has been posted.
          {state.photoError && ` Your review photos could not be added: ${state.photoError}`}
        </p>
      )}
      <div className="detail__grid">
        <DishPhoto dish={dish} className="detail__photo" />

        <div className="detail__info">
          <h2 className="title">{dish.name}</h2>
          <div className="chips">
            <PricePill price={dish.price} />
            {dish.spiceLevel > 0 && (
              <span className="chip chip--icon">
                <SpiceLevel level={dish.spiceLevel} />
              </span>
            )}
          </div>

          <section className="place-card">
            <div className="place-card__head">
              <Icon name="pin" />
              <div>
                <h3 className="title title--xs">{restaurant.name}</h3>
                <p className="meta">{[restaurant.address, formatMiles(dish.distance)].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="place-card__actions">
              <a className="btn btn--outline" href={directions} target="_blank" rel="noreferrer">
                Directions
              </a>
              <Link className="btn btn--gold" to={`/restaurant/${restaurant.id}`}>
                Other dishes
              </Link>
            </div>
          </section>

          {status ? (
            <Link to="/saved" className="btn btn--soft btn--block">
              <Icon name="check" size={18} /> {status === 'tried' ? 'Tried it · in your food list' : 'In your food list'}
            </Link>
          ) : (
            <button type="button" className="btn btn--gold btn--block" onClick={want} disabled={status === undefined}>
              <span aria-hidden="true">❤️</span> Want it
            </button>
          )}

          <Link to={`/dish/${id}/review`} className="btn btn--blue btn--block">
            Write a review
          </Link>

          <section className="detail__tags" id="dish-tags">
            {TAG_GROUPS.map(([category, label]) => {
              const names = tagNames(category)
              if (!names.length) return null
              return (
                <div key={category} className="tag-row">
                  <span className="tag-row__label">{label}</span>
                  <div className="chips">
                    {names.map((n) => (
                      <Chip key={n} tone={category === 'allergy' ? 'warn' : undefined}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </div>
              )
            })}
            {!tagNames('allergy').length && <p className="muted small">Allergen information unavailable.</p>}
          </section>

          <section>
            <h3 className="title title--sm">Anteater reviews</h3>
            {dish.reviews.length ? (
              <div className="card review-card">
                <p className="small">
                  <Stars rating={dish.rating} /> {dish.rating.toFixed(1)} · {dish.reviewCount} review
                  {dish.reviewCount === 1 ? '' : 's'}
                </p>
                {dish.reviews.map(
                  (r) =>
                    r.body && (
                      <blockquote key={r.id}>
                        “{r.body}”<cite>— {r.author?.display_name ?? 'An Anteater'}</cite>
                      </blockquote>
                    ),
                )}
              </div>
            ) : (
              <p className="muted">No reviews yet. Be the first Anteater to share one soon.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
