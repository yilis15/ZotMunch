// Drafts: unpublished posts, newest first. Continue one in the Post form, or delete it.
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { deleteDraft } from '../lib/api'
import { keys, queryClient, refreshAfter, useDrafts } from '../lib/queries'
import { fallBackTo, photoUrl, smallPhotoUrl } from '../lib/photo'
import { shortDate } from '../lib/format'
import DeleteDraftDialog from '../components/DeleteDraftDialog'
import Icon from '../components/Icon'
import { BackBar, EmptyState, ErrorNote, Loader } from '../components/ui'

export default function Drafts() {
  const { userId } = useApp()
  const { data: drafts = null, error: loadError } = useDrafts()
  const [deleteError, setDeleteError] = useState(null)
  const error = deleteError ?? loadError

  const [confirming, setConfirming] = useState(null) // the draft whose Delete was tapped
  const [deleting, setDeleting] = useState(false)
  const keep = useCallback(() => setConfirming(null), [])

  const remove = async () => {
    const draft = confirming
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDraft(draft)
      queryClient.setQueryData(keys.drafts(userId), (all) => (all ?? []).filter((d) => d.id !== draft.id))
      refreshAfter('draft')
    } catch (e) {
      setDeleteError(e)
    }
    setDeleting(false)
    setConfirming(null)
  }

  if (!drafts) {
    return error ? <div className="page page--narrow"><BackBar title="Drafts" to="/me" /><ErrorNote error={error} /></div> : <Loader label="Finding your drafts…" />
  }

  return (
    <div className="page page--narrow">
      <BackBar title="Drafts" to="/me" />
      <ErrorNote error={error} />
      {drafts.length ? (
        <div className="stack">
          {drafts.map((d) => (
            <div key={d.id} className="post-row">
              <Link to={`/post?draft=${d.id}`} className="post-row__photo">
                {d.photoPaths[0] ? (
                  <img
                    className="photo"
                    src={smallPhotoUrl(d.photoPaths[0])}
                    onError={fallBackTo(photoUrl(d.photoPaths[0]))}
                    alt=""
                  />
                ) : (
                  <span className="photo photo--empty">
                    <Icon name="draft" />
                  </span>
                )}
              </Link>
              <div className="post-row__info">
                <Link to={`/post?draft=${d.id}`}>
                  <h2 className="title title--xs">{d.name || 'Untitled bite'}</h2>
                </Link>
                <p className="meta">{d.restaurant?.name ?? 'No restaurant yet'}</p>
                <p className="meta">Saved {shortDate(d.updatedAt)}</p>
                <div className="post-row__actions">
                  <Link to={`/post?draft=${d.id}`} className="link-btn link-btn--inline">
                    Continue
                  </Link>
                  <button type="button" className="link-btn link-btn--inline link-btn--danger" onClick={() => setConfirming(d)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          mascot="sleep"
          title="No drafts"
          actions={
            <Link to="/post" className="btn btn--gold btn--block">
              Share a bite
            </Link>
          }
        >
          Tap Save draft while posting to finish a bite later.
        </EmptyState>
      )}
      {confirming && (
        <DeleteDraftDialog
          photo={confirming.photoPaths[0] && photoUrl(confirming.photoPaths[0])}
          name={confirming.name}
          restaurant={confirming.restaurant?.name}
          deleting={deleting}
          onDelete={remove}
          onKeep={keep}
        />
      )}
    </div>
  )
}
