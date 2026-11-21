// Post (Figma 11–15): share a new bite, or continue a draft (/post?draft=<id>).
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadDraft } from '../lib/queries'
import { photoItems } from '../lib/photo'
import PostForm from '../components/PostForm'
import { BackBar, ErrorNote, Loader } from '../components/ui'

const BLANK = { photos: [], name: '', restaurant: null, price: '', rating: null, body: '', tagIds: [] }

function fromDraft(d) {
  return {
    photos: photoItems(d.photoPaths),
    name: d.name,
    restaurant: d.restaurant,
    price: d.price == null ? '' : String(d.price),
    rating: d.rating,
    body: d.body,
    tagIds: d.tagIds,
  }
}

function Published({ dishId }) {
  return (
    <div className="page page--narrow published">
      <div className="published__art">
        <img src="/mascots/cookie.png" alt="" />
        <p className="eyebrow eyebrow--gold">One more happy bite</p>
      </div>
      <h1 className="title center">
        Your bite is
        <br />
        on the menu!
      </h1>
      <p className="muted center">Thanks for sharing with your fellow Anteaters.</p>
      <Link to={`/dish/${dishId}`} className="btn btn--gold btn--block">
        View my post
      </Link>
      <Link to="/" className="btn btn--outline btn--block">
        Back to Discover
      </Link>
    </div>
  )
}

export default function Post() {
  const [params] = useSearchParams()
  const draftParam = params.get('draft')
  const [form, setForm] = useState(() => (draftParam ? null : { key: 'new', initial: BLANK }))
  const [published, setPublished] = useState(null)
  const [error, setError] = useState(null)
  const ownDraft = useRef(null) // the draft this form just saved, so its URL change doesn't reload it

  useEffect(() => {
    if (draftParam && draftParam === ownDraft.current) return undefined
    let live = true
    setPublished(null)
    setError(null)
    if (!draftParam) {
      setForm({ key: `new-${Date.now()}`, initial: BLANK })
      return undefined
    }
    setForm(null)
    loadDraft(draftParam)
      .then((d) => live && setForm({ key: d.id, initial: fromDraft(d), draftId: d.id }))
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [draftParam])

  if (published) return <Published dishId={published} />
  if (error) {
    return (
      <div className="page page--narrow">
        <BackBar title="Edit draft" to="/me/drafts" />
        <ErrorNote error={error} />
      </div>
    )
  }
  if (!form) return <Loader label="Opening your draft…" />

  return (
    <div className="page page--narrow">
      <BackBar title={form.draftId ? 'Edit draft' : 'Share a bite'} />
      <PostForm
        key={form.key}
        mode="new"
        initial={form.initial}
        draftId={form.draftId}
        onDraftSaved={(id) => {
          ownDraft.current = id
        }}
        onPublished={(dishId) => {
          ownDraft.current = null
          setPublished(dishId)
        }}
      />
    </div>
  )
}
