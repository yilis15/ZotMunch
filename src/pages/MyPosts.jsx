// My posts (Figma: UI Updates · My posts): every dish you posted, with Edit and Delete,
// or Select to delete several. Deleting asks first and can't be undone.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { deletePosts } from '../lib/api'
import { keys, queryClient, refreshAfter, useMyPosts } from '../lib/queries'
import { priceLabel } from '../lib/discover'
import { shortDate } from '../lib/format'
import { matchesQuery } from '../lib/search'
import { useDeleteList } from '../lib/useDeleteList'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import { BackBar, DishPhoto, EmptyState, ErrorNote, Loader, SearchBox } from '../components/ui'

const count = (n) => `${n} post${n === 1 ? '' : 's'}`

function PostSummary({ dish }) {
  return (
    <>
      <span className="manage-card__photo">
        <DishPhoto dish={dish} />
      </span>
      <span className="manage-card__info">
        <span className="title title--xs">{dish.name}</span>
        <span className="meta">{[dish.restaurant.name, dish.restaurant.address?.split(' · ')[0]].filter(Boolean).join(' · ')}</span>
        <span className="meta">{[priceLabel(dish.price), shortDate(dish.createdAt)].filter(Boolean).join(' · ')}</span>
      </span>
    </>
  )
}

export default function MyPosts() {
  const { userId } = useApp()
  const { data: posts = null, error } = useMyPosts()
  const [query, setQuery] = useState('')
  const shown = posts?.filter((d) => matchesQuery(d, query))
  const list = useDeleteList({
    shown,
    // Deleted posts leave the cached list straight away; refreshAfter reloads what else they touched.
    setItems: (change) => queryClient.setQueryData(keys.myPosts(userId), (old) => change(old ?? [])),
    remove: async (dishes) => {
      await deletePosts(userId, dishes.map((d) => d.id))
      refreshAfter('deletePosts')
    },
  })

  if (error) return <div className="page page--narrow"><BackBar title="My posts" to="/me" /><ErrorNote error={error} /></div>
  if (!posts) return <Loader label="Gathering your bites…" />

  const n = list.pending?.length ?? 0
  const picked = list.selectedItems.length

  return (
    <div className={list.selecting ? 'page page--narrow page--bar' : 'page page--narrow'}>
      <BackBar title="My posts" to="/me" />
      {posts.length ? (
        <>
          <SearchBox value={query} onChange={setQuery} />
          <div className="saved-toolbar">
            <p className="muted small">
              {shown.length === posts.length ? count(posts.length) : `${shown.length} of ${count(posts.length)}`}
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
              <button type="button" className="link-btn" onClick={list.start}>
                Select
              </button>
            )}
          </div>
          <ErrorNote error={list.error} />

          {!shown.length && <p className="muted center">Nothing matches “{query.trim()}”. Try a dish or restaurant name.</p>}
          <div className="stack">
            {shown.map((d) =>
              list.selecting ? (
                <button
                  key={d.id}
                  type="button"
                  className="manage-card manage-card--select"
                  aria-pressed={list.selected.has(d.id)}
                  onClick={() => list.toggle(d.id)}
                >
                  <span className="checkbox" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                  <span className="manage-card__main">
                    <PostSummary dish={d} />
                  </span>
                </button>
              ) : (
                <article key={d.id} className="manage-card">
                  <Link to={`/dish/${d.id}`} className="manage-card__main">
                    <PostSummary dish={d} />
                  </Link>
                  <div className="manage-card__actions">
                    <Link to={`/me/posts/${d.id}/edit`} className="link-btn">
                      Edit
                    </Link>
                    <button type="button" className="link-btn link-btn--danger" onClick={() => list.ask([d])}>
                      <Icon name="trash" size={18} /> Delete
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </>
      ) : (
        <EmptyState
          mascot="cookie"
          title="No posts yet"
          actions={
            <Link to="/post" className="btn btn--gold btn--block">
              Share a bite
            </Link>
          }
        >
          Dishes you share show up here, ready to edit.
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
          title={n === 1 ? 'Delete this post?' : `Delete ${count(n)}?`}
          busy={list.busy}
          onConfirm={list.confirm}
          onCancel={list.cancel}
        />
      )}
    </div>
  )
}
