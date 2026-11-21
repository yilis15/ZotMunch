// My reviews (Figma: UI Updates · My reviews): everything you've rated, newest edits first, with
// Edit and Delete, or Select to delete several. Your rating on a dish you posted is part of that
// post (its photos hang on it), so it's edited and deleted with the post instead.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { deleteReviews } from '../lib/api'
import { keys, queryClient, refreshAfter, useMyReviews } from '../lib/queries'
import { fallBackTo } from '../lib/photo'
import { shortDate } from '../lib/format'
import { matchesQuery } from '../lib/search'
import { useDeleteList } from '../lib/useDeleteList'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import { BackBar, DishPhoto, EmptyState, ErrorNote, Loader, SearchBox, Stars } from '../components/ui'

const count = (n) => `${n} review${n === 1 ? '' : 's'}`

function ReviewSummary({ review: r }) {
  return (
    <>
      <span className="manage-card__photo">
        <DishPhoto dish={r.dish} />
      </span>
      <span className="manage-card__info">
        <span className="title title--xs">{r.dish.name}</span>
        <span className="meta">{r.dish.restaurant.name}</span>
        <span className="meta">
          <Stars rating={r.rating} /> · {shortDate(r.updatedAt)}
        </span>
      </span>
    </>
  )
}

function ReviewBody({ review: r }) {
  return (
    <>
      {r.body && <p className="review__body">{r.body}</p>}
      {r.photos.length > 0 && (
        <div className="thumbs">
          {r.photos.map((p) => (
            <span key={p.id} className="thumb">
              <img src={p.small} onError={fallBackTo(p.url)} alt="" loading="lazy" />
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function MyReviews() {
  const { userId } = useApp()
  const { data: reviews = null, error } = useMyReviews()
  const [query, setQuery] = useState('')
  const shown = reviews?.filter((r) => matchesQuery(r.dish, query))
  const ownPost = (r) => r.dish.createdBy === userId
  const list = useDeleteList({
    shown,
    // Deleted reviews leave the cached list straight away; refreshAfter reloads the dishes they were on.
    setItems: (change) => queryClient.setQueryData(keys.myReviews(userId), (old) => change(old ?? [])),
    remove: async (picked) => {
      await deleteReviews(userId, picked)
      refreshAfter('deleteReviews')
    },
    canDelete: (r) => !ownPost(r),
  })

  if (error) return <div className="page page--narrow"><BackBar title="My reviews" to="/me" /><ErrorNote error={error} /></div>
  if (!reviews) return <Loader label="Gathering your reviews…" />

  const n = list.pending?.length ?? 0
  const picked = list.selectedItems.length
  const anyDeletable = shown.some((r) => !ownPost(r))

  return (
    <div className={list.selecting ? 'page page--narrow page--bar' : 'page page--narrow'}>
      <BackBar title="My reviews" to="/me" />
      {reviews.length ? (
        <>
          <SearchBox value={query} onChange={setQuery} />
          <div className="saved-toolbar">
            <p className="muted small">
              {shown.length === reviews.length ? count(reviews.length) : `${shown.length} of ${count(reviews.length)}`}
            </p>
            {list.selecting ? (
              <div className="saved-toolbar__actions">
                <button type="button" className="link-btn" onClick={list.toggleAll}>
                  {list.allSelected ? 'Deselect all' : 'Select all'}
                </button>
                <button type="button" className="link-btn" onClick={list.stop}>
                  Cancel
                </button>
              </div>
            ) : (
              anyDeletable && (
                <button type="button" className="link-btn" onClick={list.start}>
                  Select
                </button>
              )
            )}
          </div>
          <ErrorNote error={list.error} />

          {!shown.length && <p className="muted center">Nothing matches “{query.trim()}”. Try a dish or restaurant name.</p>}
          <div className="stack">
            {shown.map((r) =>
              list.selecting ? (
                <button
                  key={r.id}
                  type="button"
                  className="manage-card manage-card--select"
                  aria-pressed={list.selected.has(r.id)}
                  disabled={ownPost(r)}
                  onClick={() => list.toggle(r.id)}
                >
                  <span className="checkbox" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                  <span className="manage-card__main">
                    <ReviewSummary review={r} />
                  </span>
                </button>
              ) : (
                <article key={r.id} className="manage-card">
                  <Link to={`/dish/${r.dish.id}`} className="manage-card__main">
                    <ReviewSummary review={r} />
                  </Link>
                  <ReviewBody review={r} />
                  <div className="manage-card__actions">
                    {ownPost(r) ? (
                      <>
                        <Link to={`/me/posts/${r.dish.id}/edit`} className="link-btn">
                          Edit
                        </Link>
                        <span className="muted small">Part of your post</span>
                      </>
                    ) : (
                      <>
                        <Link to={`/dish/${r.dish.id}/review`} className="link-btn">
                          Edit
                        </Link>
                        <button type="button" className="link-btn link-btn--danger" onClick={() => list.ask([r])}>
                          <Icon name="trash" size={18} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </>
      ) : (
        <EmptyState
          mascot="mug"
          title="No reviews yet"
          actions={
            <Link to="/" className="btn btn--gold btn--block">
              Find a dish to review
            </Link>
          }
        >
          Open any dish and tap Write a review to share your take.
        </EmptyState>
      )}

      {list.selecting && (
        <div className="floating-bar">
          <span>{picked} selected</span>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={!picked}
            onClick={() => list.ask(list.selectedItems)}
          >
            Delete{picked ? ` ${count(picked)}` : ''}
          </button>
        </div>
      )}

      {list.pending && (
        <ConfirmDialog
          title={n === 1 ? 'Delete this review?' : `Delete ${count(n)}?`}
          busy={list.busy}
          onConfirm={list.confirm}
          onCancel={list.cancel}
        />
      )}
    </div>
  )
}
