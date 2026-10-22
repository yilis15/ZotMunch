// Discover (Figma 04, 05, 23, 25): Swipe one dish at a time, or browse the Feed. Both share the temporary filters.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { getDishes, getSwipedDishIds, recordSwipe, wantDish } from '../lib/api'
import { BUDGETS, DISTANCES, EMPTY_FILTERS, filterCount, matchesFilters, rankForUser } from '../lib/discover'
import DishCard from '../components/DishCard'
import FilterSheet from '../components/FilterSheet'
import SwipeDeck from '../components/SwipeDeck'
import Icon from '../components/Icon'
import { Chip, EmptyState, ErrorNote, Hero, Loader, Segmented } from '../components/ui'

const TOAST_MS = 2500

export default function Discover() {
  const { userId, preferenceTagIds, tags, tagsById, filters, setFilters } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'feed' ? 'feed' : 'swipe'

  const [dishes, setDishes] = useState(null)
  const [decided, setDecided] = useState(new Set()) // skipped or wanted, now or earlier
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  useEffect(() => {
    let live = true
    Promise.all([getDishes(), getSwipedDishIds(userId)])
      .then(([d, s]) => {
        if (!live) return
        setDishes(d)
        setDecided(s)
      })
      .catch((e) => live && setError(e))
    return () => {
      live = false
      clearTimeout(toastTimer.current)
    }
  }, [userId])

  const visible = useMemo(() => {
    if (!dishes) return []
    return rankForUser(dishes, preferenceTagIds, tagsById).filter((d) => matchesFilters(d, filters, tagsById))
  }, [dishes, preferenceTagIds, tagsById, filters])

  const queue = visible.filter((d) => !decided.has(d.id))

  const decide = useCallback(
    (dish, action) => {
      setDecided((s) => new Set(s).add(dish.id))
      recordSwipe(userId, dish.id, action, 'swipe').catch(setError)
      if (action === 'want') {
        wantDish(userId, dish.id).catch(setError)
        clearTimeout(toastTimer.current)
        setToast(dish)
        toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
      }
    },
    [userId],
  )

  const open = (dish) => navigate(`/dish/${dish.id}`, { state: { from: mode } })

  const n = filterCount(filters)
  const activeChips = [
    ...filters.tagIds.map((id) => tagsById.get(id)?.name),
    ...filters.budgets.map((id) => BUDGETS.find((b) => b.id === id)?.label),
    DISTANCES.find((d) => d.id === filters.distance)?.label,
  ].filter(Boolean)

  if (error) return <div className="page"><ErrorNote error={error} /></div>
  if (!dishes || !tags.length) return <Loader />

  const noMatches = n > 0 && visible.length === 0

  return (
    <div className="page">
      {mode === 'swipe' ? (
        <Hero eyebrow="ZotMunch / Discover" title="A bite of surprise." mascot="cookie" />
      ) : (
        <Hero eyebrow="ZotMunch / Discover" title={<>Good bites<br />around campus.</>} mascot="mug" />
      )}

      <div className="discover-controls">
        <Segmented
          label="Discover mode"
          options={[['swipe', 'Swipe'], ['feed', 'Feed']]}
          value={mode}
          onChange={(m) => setParams(m === 'feed' ? { mode: 'feed' } : {}, { replace: true })}
        />
        <button type="button" className="btn btn--blue btn--bar" onClick={() => setShowFilters(true)}>
          <Icon name="filter" />
          <span>Filters{n ? ` · ${n}` : ''}</span>
          <Icon name="chevron" className="push-right" />
        </button>
      </div>

      {noMatches ? (
        <EmptyState
          mascot="orange-hug"
          title="No bites match just yet."
          actions={
            <>
              <button type="button" className="btn btn--blue btn--block" onClick={() => setShowFilters(true)}>
                Adjust filters
              </button>
              <button type="button" className="btn btn--outline btn--block" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
              <p className="muted small">Your everyday preferences stay saved.</p>
            </>
          }
        >
          A tiny change might find your next favorite.
          <span className="chips chips--center">
            {activeChips.map((c) => (
              <Chip key={c} selected>
                {c}
              </Chip>
            ))}
          </span>
        </EmptyState>
      ) : mode === 'swipe' ? (
        queue.length ? (
          <SwipeDeck
            dishes={queue}
            onSkip={(d) => decide(d, 'skip')}
            onWant={(d) => decide(d, 'want')}
            onOpen={open}
            toast={toast && <AddedToast dish={toast} />}
          />
        ) : (
          <EmptyState
            mascot="mug"
            title="You've seen every bite for now."
            actions={
              <button type="button" className="btn btn--gold btn--block" onClick={() => setParams({ mode: 'feed' })}>
                Browse the Feed
              </button>
            }
          >
            New dishes show up as Anteaters share them. Your picks are waiting in Saved.
          </EmptyState>
        )
      ) : (
        <Feed dishes={visible} query={query} setQuery={setQuery} />
      )}

      {showFilters && <FilterSheet dishes={rankForUser(dishes, preferenceTagIds, tagsById)} onClose={() => setShowFilters(false)} />}
    </div>
  )
}

function AddedToast({ dish }) {
  return (
    <div className="added-toast" role="status">
      <div>
        <strong>Added to your food list ✓</strong>
        <span>{dish.restaurant.name} · keep exploring</span>
      </div>
      <Link to="/saved" onPointerDown={(e) => e.stopPropagation()}>
        See list
      </Link>
    </div>
  )
}

function Feed({ dishes, query, setQuery }) {
  const { tagsById } = useApp()
  const q = query.trim().toLowerCase()
  const shown = (
    q
      ? dishes.filter((d) =>
          [d.name, d.restaurant.name, ...d.tagIds.map((id) => tagsById.get(id)?.name ?? '')]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : dishes
  ).sort((a, b) => b.saveCount - a.saveCount)

  return (
    <>
      <label className="search">
        <Icon name="search" />
        <span className="sr-only">Search dishes</span>
        <input
          type="search"
          placeholder="Dish, restaurant, or craving"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="section-head">
        <h2 className="title title--sm">Popular with Anteaters</h2>
        <span className="muted small">{shown.length} dishes</span>
      </div>
      {shown.length ? (
        <div className="feed-grid">
          {shown.map((d) => (
            <DishCard key={d.id} dish={d} from="feed" />
          ))}
        </div>
      ) : (
        <p className="muted center">Nothing matches “{query}”. Try a dish or restaurant name.</p>
      )}
    </>
  )
}
