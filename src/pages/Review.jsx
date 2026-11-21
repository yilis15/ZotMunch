// Write a review (Figma 08): rating, optional tags and photos, and a note. Reached from a dish's
// "Write a review" button or from Post's duplicate prompt (which carries the photos and note over).
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { checkContent, rejectedIn, removeStoragePhotos, submitReview } from '../lib/api'
import { loadDish, loadMyReview, refreshAfter } from '../lib/queries'
import { photoItems } from '../lib/photo'
import { useUnusedUploads } from '../lib/useUnusedUploads'
import ModerationDialog from '../components/ModerationDialog'
import PhotoPicker from '../components/PhotoPicker'
import { rejectionOf, showFirstProblem } from '../lib/moderation'
import StarRating from '../components/StarRating'
import TagEditor from '../components/TagEditor'
import { BackBar, Chip, DishPhoto, ErrorNote, Hero, Loader, PostDeleted } from '../components/ui'
import { isMissing } from '../lib/deleted'

export default function Review() {
  const { id } = useParams()
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { userId, tagsById } = useApp()
  // Read once, then cleared from the history entry: leaving this page deletes unused carried photos,
  // so coming back with the browser's Back button mustn't offer those deleted files again.
  const carry = useRef(state?.carry).current

  const [dish, setDish] = useState(null)
  const [existing, setExisting] = useState(undefined)
  const [rating, setRating] = useState(null)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState([])
  const [tagIds, setTagIds] = useState([])
  const [showTags, setShowTags] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false) // false | 'check' | 'post'
  const [error, setError] = useState(null)
  const [badBody, setBadBody] = useState(false) // the content check turned the note down
  const [rejection, setRejection] = useState(null) // what ModerationDialog lists
  const closeRejection = useCallback(() => {
    showFirstProblem(rejection, { photos: '.photo-picker', body: '#review-body' })
    setRejection(null)
  }, [rejection])
  const markUploadsUsed = useUnusedUploads(photos)

  useEffect(() => {
    if (state?.carry) navigate(pathname, { replace: true, state: null })
  }, [state, pathname, navigate])

  useEffect(() => {
    let live = true
    Promise.all([loadDish(id), loadMyReview(userId, id)])
      .then(([d, mine]) => {
        if (!live) return
        setDish(d)
        setExisting(mine)
        setTagIds(d.tagIds)
        setRating(carry?.rating ?? mine?.rating ?? null)
        setBody([mine?.body, carry?.body].filter(Boolean).join('\n\n'))
        setPhotos([
          ...(mine?.photos ?? []).map((p) => ({ key: p.id, id: p.id, path: p.path, url: p.url, small: p.small })),
          ...photoItems(carry?.photoPaths ?? []).map((p) => ({ ...p, fresh: carry.freshPaths.includes(p.path) })),
        ])
      })
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [id, userId, carry])

  if (error && !dish) {
    return (
      <div className="page page--narrow">
        <BackBar title="Write a review" />
        {isMissing(error) ? <PostDeleted /> : <ErrorNote error={error} />}
      </div>
    )
  }
  if (!dish || existing === undefined) return <Loader label="Getting the dish ready…" />

  // Tags someone else added stay put; the dish's poster may change any tag.
  const isPoster = dish.createdBy === userId
  const locked = new Set(dish.tagIds.filter((t) => !isPoster && dish.tagAddedBy.get(t) !== userId))
  const uploading = photos.some((p) => p.uploading)

  const submit = async () => {
    setTried(true)
    if (!rating) return
    setBusy('check')
    setError(null)
    const kept = new Set(photos.map((p) => p.id).filter(Boolean))
    const removed = (existing?.photos ?? []).filter((p) => !kept.has(p.id))
    const newPaths = photos.filter((p) => !p.id && p.path && !p.failed).map((p) => p.path)
    try {
      // Content check: new photos, and the note only when it changed.
      const verdict = rejectedIn(
        await checkContent({ photoPaths: newPaths, texts: body !== (existing?.body ?? '') ? { body } : {} }),
      )
      if (verdict.any) {
        setPhotos((all) => all.map((p) => ({ ...p, rejected: verdict.photos.get(p.path) }))) // clears photos that pass now
        setBadBody(!!verdict.texts.body)
        setRejection(rejectionOf(photos, verdict))
        setBusy(false)
        return
      }
      setBusy('post')
      await submitReview({
        dishId: id,
        rating,
        body,
        addTagIds: tagIds.filter((t) => !dish.tagIds.includes(t)),
        removeTagIds: dish.tagIds.filter((t) => !tagIds.includes(t)),
        photoPaths: newPaths,
        removePhotoIds: removed.map((p) => p.id),
      })
      markUploadsUsed()
      refreshAfter('review')
      removeStoragePhotos(removed.map((p) => p.path)).catch(() => {})
      navigate(`/dish/${id}`, { replace: true, state: { reviewed: true } })
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  const shownTags = tagIds.map((t) => tagsById.get(t)).filter(Boolean)

  return (
    <div className="page page--narrow">
      <BackBar title={existing ? 'Edit your review' : 'Write a review'} />
      <Hero eyebrow="Your honest take" title={<>Tell us about<br />this bite.</>} mascot="cookie" />

      <section className="dish-summary card">
        <DishPhoto dish={dish} className="dish-summary__photo" />
        <div className="dish-summary__info">
          <h2 className="title title--xs">{dish.name}</h2>
          <p className="meta">{[dish.restaurant.name, dish.restaurant.address?.split(' · ')[0]].filter(Boolean).join(' · ')}</p>
          <div className="dish-summary__tags">
            <span className="chips">
              {shownTags.slice(0, 4).map((t) => (
                <Chip key={t.id}>{t.name}</Chip>
              ))}
              {shownTags.length > 4 && <span className="muted small">+{shownTags.length - 4}</span>}
            </span>
            <button type="button" className="link-btn" onClick={() => setShowTags(true)}>
              Edit tags
            </button>
          </div>
        </div>
      </section>

      <section className="field">
        <div className="field-label-row">
          <span className="field-label">How was it?</span>
          <span className="field-required">Required</span>
        </div>
        <StarRating value={rating} onChange={setRating} label="Your rating" />
        {tried && !rating && <p className="field-error">Tap a star to rate it.</p>}
      </section>

      <section className="field">
        <label className="field-label" htmlFor="review-body">
          What should other Anteaters know about this dish?
        </label>
        <textarea
          id="review-body"
          className={badBody ? 'input textarea input--invalid' : 'input textarea'}
          value={body}
          placeholder="A little spicy, rich, and comforting."
          maxLength={1000}
          onChange={(e) => {
            setBody(e.target.value)
            setBadBody(false)
          }}
        />
        {badBody && <p className="field-error">Please keep this about the food.</p>}
      </section>

      <section className="field">
        <span className="field-label">
          Photos <span className="muted small">(optional)</span>
        </span>
        <PhotoPicker userId={userId} photos={photos} setPhotos={setPhotos} />
      </section>

      <ErrorNote error={error} />
      <button type="button" className="btn btn--blue btn--block" onClick={submit} disabled={busy || uploading}>
        {uploading
          ? 'Uploading photos…'
          : busy === 'check'
            ? 'Checking…'
            : busy
              ? 'Posting…'
              : existing
                ? 'Update review'
                : 'Post review'}
      </button>

      {rejection && <ModerationDialog rejection={rejection} onClose={closeRejection} />}
      {showTags && (
        <TagEditor
          selected={tagIds}
          locked={locked}
          onClose={() => setShowTags(false)}
          onDone={(ids) => {
            setTagIds(ids)
            setShowTags(false)
          }}
        />
      )}
    </div>
  )
}
