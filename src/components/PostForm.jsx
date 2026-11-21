// The Share-a-bite form (Figma 11–14, 20), used for a new post, a draft, and editing a post.
// mode "new": Publish post + Save draft. mode "edit": Save changes on an existing dish.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import {
  checkContent,
  findDishByName,
  normalizeDishName,
  publishPost,
  rejectedIn,
  removeStoragePhotos,
  saveDraft,
  updatePost,
} from '../lib/api'
import { refreshAfter } from '../lib/queries'
import { useUnusedUploads } from '../lib/useUnusedUploads'
import DuplicateSheet from './DuplicateSheet'
import LeaveDialog from './LeaveDialog'
import ModerationDialog from './ModerationDialog'
import { rejectionOf, showFirstProblem } from '../lib/moderation'
import Icon from './Icon'
import PhotoPicker from './PhotoPicker'
import RestaurantPicker from './RestaurantPicker'
import StarRating from './StarRating'
import TagEditor from './TagEditor'
import { Chip, ErrorNote } from './ui'

const DUPLICATE_CHECK_MS = 500
const KEEP_IT_FOOD = 'Please keep this about the food.' // text the content check turned down
const MAX_PRICE = 9999.99 // dishes.price and post_drafts.price are numeric(6,2)

// What the price box keeps as people type or paste: digits and one period, up to 9999.99.
// Commas are thousands separators ("1,230.50"), so they're dropped rather than read as a decimal point.
function cleanPrice(text) {
  const [whole, ...rest] = text.replace(/[^\d.]/g, '').split('.')
  const dollars = whole.slice(0, 4)
  return rest.length ? `${dollars}.${rest.join('').slice(0, 2)}` : dollars
}

// Old drafts can still hold a price the box would no longer accept.
function parsePrice(text) {
  if (!text.trim()) return null
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 && n <= MAX_PRICE ? Math.round(n * 100) / 100 : NaN
}

// A typed character other than a digit or "." never reaches the box. Chrome also reports a paste
// here, as one longer string, so anything longer is left for cleanPrice to tidy.
const onlyPriceKeys = (e) => {
  if (e.data?.length === 1 && /[^\d.]/.test(e.data)) e.preventDefault()
}

// What the form holds, for telling whether anything changed since it opened or was last saved as a draft.
// A photo still uploading counts by its key, so picking one is a change straight away.
const contentOf = ({ photos, name, restaurant, price, rating, body, tagIds }) =>
  JSON.stringify([photos.map((p) => p.path ?? p.key), name.trim(), restaurant?.id ?? null, price, rating, body.trim(), tagIds])

export default function PostForm({ mode, initial, draftId: initialDraftId, onDraftSaved, onPublished }) {
  const { userId, tagsById } = useApp()
  const navigate = useNavigate()
  const editing = mode === 'edit'

  const [photos, setPhotos] = useState(initial.photos)
  const [name, setName] = useState(initial.name)
  const [restaurant, setRestaurant] = useState(initial.restaurant)
  const [price, setPrice] = useState(initial.price)
  const [rating, setRating] = useState(initial.rating)
  const [body, setBody] = useState(initial.body)
  const [tagIds, setTagIds] = useState(initial.tagIds)
  const [draftId, setDraftId] = useState(initialDraftId ?? null)

  const [showTags, setShowTags] = useState(false)
  const [duplicate, setDuplicate] = useState(null)
  const [keptPosting, setKeptPosting] = useState(null) // "restaurant|name" the user said is a different dish
  const [tried, setTried] = useState(false) // show field errors after the first publish attempt
  const [busy, setBusy] = useState(null) // 'check' | 'publish' | 'draft'
  const [savedAt, setSavedAt] = useState(initialDraftId ? 'earlier' : null)
  const [error, setError] = useState(null)
  const [badText, setBadText] = useState({}) // { name?: true, body?: true }: text the content check turned down
  const [rejection, setRejection] = useState(null) // what ModerationDialog lists
  const closeRejection = useCallback(() => {
    showFirstProblem(rejection, { photos: '[data-tour="photos"]', name: '#post-name', body: '#post-body' })
    setRejection(null)
  }, [rejection])

  const markUploadsUsed = useUnusedUploads(photos)
  // Paths in the saved draft: their files stay until a later save no longer lists them.
  const draftPaths = useRef(initial.photos.filter((p) => !p.id && p.path).map((p) => p.path))

  // Leaving a new post or a draft with unsaved changes asks first (LeaveDialog). Edit post doesn't.
  const savedContent = useRef(contentOf(initial))
  const content = contentOf({ photos, name, restaurant, price, rating, body, tagIds })
  const unsaved = !editing && content !== savedContent.current
  const leaving = useRef(false) // set around navigations the form makes itself, which never ask
  const blocker = useBlocker(
    ({ currentLocation: from, nextLocation: to }) =>
      unsaved && !leaving.current && (from.pathname !== to.pathname || from.search !== to.search),
  )
  const go = (...args) => {
    leaving.current = true
    navigate(...args)
    leaving.current = false
  }

  // Closing the tab or reloading: the browser shows its own "Leave site?" prompt.
  useEffect(() => {
    if (!unsaved) return undefined
    const onUnload = (e) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [unsaved])

  const dupKey =restaurant && name.trim() ? `${restaurant.id}|${normalizeDishName(name)}` : null

  // After name and restaurant are both filled in, look for the same dish at that restaurant.
  useEffect(() => {
    if (!dupKey || dupKey === keptPosting) return undefined
    let live = true
    const timer = setTimeout(() => {
      findDishByName(restaurant.id, name, initial.dishId)
        .then((found) => live && found && setDuplicate(found))
        .catch(() => {})
    }, DUPLICATE_CHECK_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [dupKey, keptPosting, restaurant, name, initial.dishId])

  const priceValue = parsePrice(price)
  const sameName = dupKey && dupKey === keptPosting
  const readyPhotos = photos.filter((p) => p.path && !p.failed)
  const newPhotoPaths = readyPhotos.filter((p) => !p.id).map((p) => p.path)
  const problems = {
    photos: readyPhotos.length ? null : 'Add at least one photo of the dish.',
    name: !name.trim() ? 'Add the dish name.' : sameName ? 'Give it a name that tells it apart from the existing dish.' : null,
    restaurant: !restaurant ? 'Pick the restaurant.' : null,
    price:
      priceValue == null
        ? 'Price is required.'
        : Number.isNaN(priceValue)
          ? `Enter a price like 12.50, up to $${MAX_PRICE.toLocaleString('en-US')}.`
          : null,
    rating: !rating ? 'Tap a star to rate it.' : null,
  }
  const uploading = photos.some((p) => p.uploading)
  const show = (field) => tried && problems[field]

  // After a save: delete the files of draft photos the user removed, and remember what the draft lists now.
  const settleDraftPhotos = () => {
    const kept = readyPhotos.map((p) => p.path)
    removeStoragePhotos(draftPaths.current.filter((path) => !kept.includes(path))).catch(() => {})
    draftPaths.current = kept
  }

  const publish = async () => {
    setTried(true)
    setError(null)
    if (Object.values(problems).some(Boolean)) return
    setBusy('check')
    try {
      // Content check first: new photos, and the text (an edit sends only what changed, so an old
      // post's untouched words aren't re-checked). Answers already on record cost nothing.
      const texts = {}
      if (!editing || name.trim() !== initial.name) texts.name = name.trim()
      if (!editing || body !== initial.body) texts.body = body
      const verdict = rejectedIn(
        await checkContent({ photoPaths: editing ? newPhotoPaths : readyPhotos.map((p) => p.path), texts }),
      )
      if (verdict.any) {
        setPhotos((all) => all.map((p) => ({ ...p, rejected: verdict.photos.get(p.path) }))) // clears photos that pass now
        setBadText(verdict.texts)
        setRejection(rejectionOf(photos, verdict))
        setBusy(null)
        return
      }
      setBusy('publish')
      if (editing) {
        const kept = new Set(photos.map((p) => p.id).filter(Boolean))
        const removed = initial.photos.filter((p) => p.id && !kept.has(p.id))
        await updatePost({
          dishId: initial.dishId,
          restaurantId: restaurant.id,
          name: name.trim(),
          price: priceValue,
          rating,
          body,
          tagIds,
          addPhotoPaths: newPhotoPaths,
          removePhotoIds: removed.map((p) => p.id),
        })
        markUploadsUsed()
        refreshAfter('post')
        removeStoragePhotos(removed.map((p) => p.path)).catch(() => {})
        go(`/dish/${initial.dishId}`, { replace: true })
        return
      }
      const dishId = await publishPost({
        restaurantId: restaurant.id,
        name: name.trim(),
        price: priceValue,
        rating,
        body,
        tagIds,
        photoPaths: readyPhotos.map((p) => p.path),
        draftId,
      })
      markUploadsUsed()
      refreshAfter('post')
      settleDraftPhotos()
      onPublished(dishId)
    } catch (e) {
      if (e.code === '23505') {
        const found = await findDishByName(restaurant.id, name, initial.dishId).catch(() => null)
        if (found) setDuplicate(found)
        else setError(e)
      } else {
        setError(e)
      }
      setBusy(null)
    }
  }

  // `stay` is false when saving on the way out (LeaveDialog): the page is leaving, so its URL stays put.
  // Returns whether the draft saved.
  const keepDraft = async ({ stay = true } = {}) => {
    setBusy('draft')
    setError(null)
    const saving = content
    try {
      const id = await saveDraft({
        id: draftId,
        restaurantId: restaurant?.id,
        name: name.trim(),
        price: Number.isNaN(priceValue) ? null : priceValue,
        rating,
        body,
        tagIds,
        photoPaths: readyPhotos.map((p) => p.path),
      })
      setPhotos((all) => all.map((p) => (p.path ? { ...p, fresh: false } : p))) // the draft refers to them now
      settleDraftPhotos()
      savedContent.current = saving
      refreshAfter('draft')
      onDraftSaved?.(id)
      if (!draftId && stay) go(`/post?draft=${id}`, { replace: true })
      setDraftId(id)
      setSavedAt('now')
      setBusy(null)
      return true
    } catch (e) {
      setError(e)
      setBusy(null)
      return false
    }
  }

  const saveAndLeave = async () => {
    if (await keepDraft({ stay: false })) blocker.proceed()
    else blocker.reset()
  }

  const reviewInstead = () => {
    markUploadsUsed()
    go(`/dish/${duplicate.id}/review`, {
      state: {
        carry: {
          photoPaths: readyPhotos.map((p) => p.path),
          freshPaths: readyPhotos.filter((p) => p.fresh).map((p) => p.path),
          body,
          rating,
        },
      },
    })
  }

  const keepPosting = useCallback(() => {
    setKeptPosting(dupKey)
    setDuplicate(null)
  }, [dupKey])

  const selectedTags = tagIds.map((id) => tagsById.get(id)).filter(Boolean)

  return (
    <>
      {savedAt && !editing && (
        <div className="banner banner--gold" role="status">
          <strong>Draft saved</strong>
          <span>{savedAt === 'now' ? 'Find it any time in Me → Drafts.' : 'Continue your unpublished post.'}</span>
        </div>
      )}

      <section className="field" data-tour="photos">
        <div className="field-label-row">
          <span className="field-label">Photos</span>
          <span className="field-required">Required</span>
        </div>
        <PhotoPicker userId={userId} photos={photos} setPhotos={setPhotos} />
        {show('photos') && <p className="field-error">{problems.photos}</p>}
      </section>

      <section className="field" data-tour="dish-name">
        <div className="field-label-row">
          <label className="field-label" htmlFor="post-name">
            Dish name
          </label>
          <span className="field-required">Required</span>
        </div>
        <input
          id="post-name"
          className={show('name') || badText.name ? 'input input--invalid' : 'input'}
          value={name}
          placeholder="Mapo tofu"
          maxLength={80}
          onChange={(e) => {
            setName(e.target.value)
            setBadText((b) => ({ ...b, name: false }))
          }}
        />
        {(show('name') || sameName) && <p className="field-error">{problems.name}</p>}
        {badText.name && !show('name') && <p className="field-error">{KEEP_IT_FOOD}</p>}
      </section>

      <section className="field" data-tour="restaurant">
        <div className="field-label-row">
          <label className="field-label" htmlFor="post-restaurant">
            Restaurant
          </label>
          <span className="field-required">Required</span>
        </div>
        <RestaurantPicker value={restaurant} onChange={setRestaurant} invalid={!!show('restaurant')} />
        {show('restaurant') && <p className="field-error">{problems.restaurant}</p>}
      </section>

      <section className="field">
        <div className="field-label-row">
          <label className="field-label" htmlFor="post-price">
            Price
          </label>
          <span className="field-required">Required</span>
        </div>
        <div className={show('price') ? 'money input--invalid' : 'money'}>
          <span aria-hidden="true">$</span>
          <input
            id="post-price"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            value={price}
            placeholder="12.50"
            onBeforeInput={onlyPriceKeys}
            onChange={(e) => setPrice(cleanPrice(e.target.value))}
          />
        </div>
        <p className="field-hint">USD · Price for one dish · Use a period for cents, e.g. 12.50</p>
        {show('price') && <p className="field-error">{problems.price}</p>}
      </section>

      <section className="field">
        <div className="field-label-row">
          <span className="field-label">How was it?</span>
          <span className="field-required">Required</span>
        </div>
        <StarRating value={rating} onChange={setRating} label="Your rating" />
        {show('rating') && <p className="field-error">{problems.rating}</p>}
      </section>

      <section className="field">
        <label className="field-label" htmlFor="post-body">
          What should other Anteaters know about this dish?
        </label>
        <textarea
          id="post-body"
          className={badText.body ? 'input textarea input--invalid' : 'input textarea'}
          value={body}
          placeholder="A little spicy, rich, and comforting."
          maxLength={1000}
          onChange={(e) => {
            setBody(e.target.value)
            setBadText((b) => ({ ...b, body: false }))
          }}
        />
        {badText.body && <p className="field-error">{KEEP_IT_FOOD}</p>}
      </section>

      <button type="button" className="tag-card" onClick={() => setShowTags(true)}>
        <span className="tag-card__head">
          <strong>{editing ? 'Dish tags' : 'Review dish tags'}</strong>
          <span className="tag-card__optional">
            Optional <Icon name="chevron" size={14} />
          </span>
        </span>
        <span className="muted small">
          Check the current tags, update anything that's changed, or add what you noticed. You can publish without
          editing tags.
        </span>
        <span className="chips">
          {selectedTags.length ? (
            selectedTags.map((t) => <Chip key={t.id}>{t.name}</Chip>)
          ) : (
            <span className="muted small">No tags yet</span>
          )}
        </span>
      </button>

      <ErrorNote error={error} />
      {tried && Object.values(problems).some(Boolean) && (
        <p className="field-error center">Fill in the highlighted fields to publish.</p>
      )}

      <div className="stack">
        <button type="button" className="btn btn--gold btn--block" onClick={publish} disabled={!!busy || uploading}>
          {uploading
            ? 'Uploading photos…'
            : busy === 'check'
              ? 'Checking…'
              : busy === 'publish'
                ? 'Saving…'
              : editing
                ? 'Save changes'
                : 'Publish post'}
        </button>
        {!editing && (
          <button type="button" className="btn btn--outline btn--block" onClick={() => keepDraft()} disabled={!!busy || uploading}>
            {busy === 'draft' ? 'Saving draft…' : 'Save draft'}
          </button>
        )}
      </div>

      {showTags && (
        <TagEditor
          selected={tagIds}
          onClose={() => setShowTags(false)}
          onDone={(ids) => {
            setTagIds(ids)
            setShowTags(false)
          }}
        />
      )}
      {rejection && <ModerationDialog rejection={rejection} onClose={closeRejection} />}
      {duplicate && <DuplicateSheet dish={duplicate} onReview={reviewInstead} onKeepPosting={keepPosting} />}
      {blocker.state === 'blocked' && (
        <LeaveDialog
          photo={photos.find((p) => p.url && !p.failed)?.url}
          name={name.trim()}
          restaurant={restaurant?.name}
          saving={busy === 'draft'}
          onSave={saveAndLeave}
          onDiscard={blocker.proceed}
          onStay={blocker.reset}
        />
      )}
    </>
  )
}
