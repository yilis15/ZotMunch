// Dish details (Figma 07): photos, price, restaurant, Want it, tags, and Anteater reviews.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { recordSwipe, removeSaves, saveDish } from '../lib/api'
import { keys, queryClient, refreshAfter, useDish, useDishLists } from '../lib/queries'
import { listName, targetIds, targetsOrMySaves, targetsText, useSaveTargets } from '../lib/lists'
import { fallBackTo } from '../lib/photo'
import { formatMiles } from '../lib/location'
import { FILTER_CATEGORIES } from '../lib/discover'
import Avatar from '../components/Avatar'
import { PricePill } from '../components/DishCard'
import Icon from '../components/Icon'
import PhotoCarousel from '../components/PhotoCarousel'
import SaveToSheet from '../components/SaveToSheet'
import SavingToRow from '../components/SavingToRow'
import { BackBar, Chip, ErrorNote, Loader, PostDeleted, Stars } from '../components/ui'
import { isMissing } from '../lib/deleted'
import { shortDate } from '../lib/format'
import { PRACTICE_ID, practiceDish } from '../lib/tour'

const TAG_GROUPS = [['dietary', 'Fits'], ['allergy', 'Contains'], ...FILTER_CATEGORIES]

// Tap a thumbnail to see it full size; tap again (or Esc) to close.
function PhotoViewer({ url, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <button type="button" className="photo-viewer" onClick={onClose} aria-label="Close photo">
      <img src={url} alt="" />
    </button>
  )
}

function ReviewItem({ review, mine, onPhoto }) {
  return (
    <article className="review">
      <header className="review__head">
        <Avatar url={review.author?.avatar_url} size={36} />
        <div>
          <p className="review__name">
            {review.author?.display_name ?? 'An Anteater'}
            {mine && <span className="muted small"> · you</span>}
          </p>
          <p className="meta">
            <Stars rating={review.rating} /> · {shortDate(review.createdAt)}
            {review.updatedAt > review.createdAt && ' · edited'}
          </p>
        </div>
      </header>
      {review.body && <p className="review__body">{review.body}</p>}
      {review.photos.length > 0 && (
        <div className="thumbs">
          {review.photos.map((p) => (
            <button key={p.id} type="button" className="thumb" onClick={() => onPhoto(p.url)} aria-label="View photo">
              <img src={p.small} onError={fallBackTo(p.url)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default function DishDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const { userId, tags, tagsById, tourPhase } = useApp()
  const practice = tourPhase && id === PRACTICE_ID // the guide's practice dish isn't in the database
  const dishQuery = useDish(id, { enabled: !practice })
  const listsQuery = useDishLists(id, { enabled: !practice })
  const { targets, hasShared, lists } = useSaveTargets()
  const [sheet, setSheet] = useState(null) // 'targets' | 'manage'
  const [toast, setToast] = useState(null) // { lists, added } after Want it, with Undo
  const toastTimer = useRef()
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const practiceVersion = useMemo(() => (practice ? practiceDish(tags) : null), [practice, tags])
  const dish = practice ? practiceVersion : dishQuery.data
  const inLists = practice ? null : listsQuery.data // undefined while loading
  const dishSaves = inLists?.saves ?? []
  const savedIn = lists ? lists.filter((l) => dishSaves.some((s) => s.listId === l.id)) : []
  const saved = dishSaves.length > 0
  const [wantError, setWantError] = useState(null)
  const error = practice ? null : wantError ?? dishQuery.error ?? listsQuery.error
  const [viewing, setViewing] = useState(null)
  const reviewsRef = useRef(null)
  const justReviewed = state?.reviewed

  // Coming back from Write a review: jump to the reviews so the new one is in view.
  useEffect(() => {
    if (dish && justReviewed) reviewsRef.current?.scrollIntoView({ block: 'start' })
  }, [dish, justReviewed])

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

  // Want it from a dish opened in Discover also counts as a "want" swipe for that mode, like swiping
  // right, so Swipe knows it was just wanted. Opened from anywhere else, it only saves the dish.
  // It saves into every list in the save targets (spec 3.6).
  const want = async () => {
    if (practice) return // the guide's practice dish is never written to the database
    const cacheKey = keys.dishLists(userId, id)
    const before = queryClient.getQueryData(cacheKey)
    const into = targetsOrMySaves(targets)
    // Show it saved right away.
    queryClient.setQueryData(cacheKey, (old) => ({
      tried: old?.tried ?? false,
      saves: into.map((l) => ({ id: `pending-${l.id ?? 'mine'}`, listId: l.id, userId })),
    }))
    if (from === 'swipe' || from === 'feed') recordSwipe(userId, id, 'want', from).catch(() => {})
    const added = targetIds(userId, targets).then((ids) => saveDish(id, ids))
    if (hasShared) {
      clearTimeout(toastTimer.current)
      setToast({ lists: into, added })
      toastTimer.current = setTimeout(() => setToast(null), 5000)
    }
    try {
      await added
      refreshAfter('want')
    } catch (e) {
      queryClient.setQueryData(cacheKey, before)
      setToast(null)
      setWantError(e)
    }
  }

  const undoWant = async () => {
    const { added } = toast
    clearTimeout(toastTimer.current)
    setToast(null)
    try {
      const saves = await added
      if (saves.length) await removeSaves(saves.map((s) => s.saveId))
      refreshAfter('want')
    } catch (e) {
      setWantError(e)
    }
  }

  if (error) {
    return (
      <div className="page page--narrow">
        <BackBar title="Dish details" />
        {isMissing(error) ? <PostDeleted /> : <ErrorNote error={error} />}
      </div>
    )
  }
  if (!dish) return <Loader label="Plating it up…" />

  const { restaurant } = dish
  const tagNames = (category) =>
    dish.tagIds.map((t) => tagsById.get(t)).filter((t) => t?.category === category).map((t) => t.name)
  // The place ID opens the exact branch; demo restaurants have made-up IDs, so they search by name and address only.
  const placeId = restaurant.google_place_id?.startsWith('seed-') ? null : restaurant.google_place_id
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [restaurant.name, restaurant.address].filter(Boolean).join(' '),
  )}${placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : ''}`

  return (
    <div className="page detail">
      <BackBar title="Dish details" />
      <div className="detail__grid">
        <div className="detail__media">
          <PhotoCarousel dish={dish} className="detail__photo" />
        </div>

        <div className="detail__info">
          <h2 className="title">{dish.name}</h2>
          <div className="chips">
            <PricePill price={dish.price} />
            {dish.practice && <Chip>Practice</Chip>}
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

          {saved && !hasShared ? (
            <Link to="/saved" className="btn btn--soft btn--block">
              <Icon name="check" size={18} /> {inLists.tried ? 'Tried it · in your food list' : 'In your food list'}
            </Link>
          ) : saved ? (
            <button type="button" className="btn btn--soft btn--block" onClick={() => setSheet('manage')} aria-haspopup="dialog">
              <Icon name="check" size={18} /> {inLists.tried ? 'Tried it · in' : 'Saved in'}{' '}
              {savedIn.length > 1 ? `${savedIn.length} lists` : savedIn.length ? listName(savedIn[0]) : 'My Saves'}
              <Icon name="down" size={16} />
            </button>
          ) : (
            <div className="want-block">
              <button type="button" className="btn btn--gold btn--block" onClick={want} disabled={!practice && inLists === undefined}>
                <span aria-hidden="true">❤️</span> Want it
              </button>
              {hasShared && !practice && <SavingToRow targets={targets} onClick={() => setSheet('targets')} />}
            </div>
          )}

          <section className="detail__tags">
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

          <section ref={reviewsRef} className="reviews" id="reviews">
            <h3 className="title title--sm">Anteater reviews</h3>
            {justReviewed && (
              <div className="banner" role="status">
                <strong>Thanks! Your review is up.</strong>
                <span>Other Anteaters can see it now.</span>
              </div>
            )}
            {dish.reviews.length ? (
              <div className="card review-card">
                <p className="small">
                  <Stars rating={dish.rating} /> {dish.rating.toFixed(1)} · {dish.reviewCount} review
                  {dish.reviewCount === 1 ? '' : 's'}
                </p>
                {dish.reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} mine={r.userId === userId} onPhoto={setViewing} />
                ))}
              </div>
            ) : (
              <p className="muted">No reviews yet. Be the first Anteater to share one.</p>
            )}
            <Link to={`/dish/${dish.id}/review`} className="btn btn--blue btn--block">
              {dish.reviews.some((r) => r.userId === userId) ? 'Edit your review' : 'Write a review'}
            </Link>
            {dish.createdBy === userId && (
              <Link to={`/me/posts/${dish.id}/edit`} className="link-btn">
                You posted this dish · Edit post
              </Link>
            )}
          </section>
        </div>
      </div>
      {viewing && <PhotoViewer url={viewing} onClose={() => setViewing(null)} />}
      {sheet === 'targets' && <SaveToSheet mode="targets" onClose={() => setSheet(null)} />}
      {sheet === 'manage' && <SaveToSheet mode="manage" dish={dish} dishSaves={dishSaves} onClose={() => setSheet(null)} />}
      {toast && (
        <div className="floating-bar floating-bar--dark" role="status">
          <span>Saved to {targetsText(toast.lists, { max: 26 })}</span>
          <button type="button" className="floating-bar__action" onClick={undoWant}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
