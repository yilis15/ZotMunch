// Discover (Figma 04, 05, 23, 25): Swipe one dish at a time, or browse the Feed. Both share the temporary filters.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { discoverPage, recordSwipe, removeSaves, saveDish } from '../lib/api'
import { refreshAfter, SWIPE_PAGE, useFeed, useSavedIn, useSwipeDeck } from '../lib/queries'
import { BUDGETS, DEFAULT_SORT, DISTANCES, EMPTY_FILTERS, filterCount, sortOf } from '../lib/discover'
import { practiceDish, TOUR_STEPS, TOUR_SWIPES } from '../lib/tour'
import { targetIds, targetsOrMySaves, targetsText, useSaveTargets } from '../lib/lists'
import DishCard from '../components/DishCard'
import FilterSheet from '../components/FilterSheet'
import SaveToSheet from '../components/SaveToSheet'
import SavingToRow from '../components/SavingToRow'
import SortMenu from '../components/SortMenu'
import SwipeDeck from '../components/SwipeDeck'
import Icon from '../components/Icon'
import { Chip, EmptyState, ErrorNote, Hero, Loader, SearchBox, Segmented } from '../components/ui'

const TOAST_MS = 2500
const UNDO_TOAST_MS = 4000 // long enough to reach Undo
const HINT_SWIPES = 3 // with the Saving to row, the swipe hint goes after this many swipes
const HINT_KEY = 'zotmunch.swipesSeen'

function swipesSeen() {
  try {
    return Number(localStorage.getItem(HINT_KEY)) || 0
  } catch {
    return 0
  }
}
const REFILL_BELOW = 5 // fetch the next batch while this many cards are still left
const RECENT_KEEP = 10 // just-swiped dishes left out of the next batch, in case their swipe isn't saved yet
const SEARCH_DELAY_MS = 300

// The database ranks Discover (discover_dishes): allergens hidden, more of the user's diets first, then
// nearer. Swipe gets never-swiped dishes first, then the longest-ago swiped, so asking for "the next
// batch" after each swipe keeps the deck going forever; Feed is most saved first, a page at a time.
// Both live in the data cache (queries.js), so coming back from a dish finds them where they were.
export default function Discover() {
  const { userId, tags, tagsById, filters, setFilters, tourPhase, setTourPhase } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  // During the guide, Discover shows the practice dish in Swipe, whatever the real dishes are.
  const touring = Boolean(tourPhase)
  const mode = !touring && params.get('mode') === 'feed' ? 'feed' : 'swipe'

  const [actionError, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  // The Feed search is kept in the address (?q=), so Back from a dish brings it back too.
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const search = mode === 'feed' ? (params.get('q') ?? '') : '' // `query` once typing pauses
  const [toast, setToast] = useState(null) // { dish, lists, added } after a right swipe
  const toastTimer = useRef()
  // Where right swipes save (spec 3.5). People without a shared list never see any of this.
  const { targets, hasShared } = useSaveTargets()
  const [choosing, setChoosing] = useState(false)
  const [seen, setSeen] = useState(swipesSeen)
  const refilling = useRef(false)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    if (mode !== 'feed' || query === search) return undefined
    const timer = setTimeout(
      () =>
        setParams(
          (p) => {
            const next = new URLSearchParams(p)
            if (query) next.set('q', query)
            else next.delete('q')
            return next
          },
          { replace: true },
        ),
      SEARCH_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [mode, query, search, setParams])

  const swipe = useSwipeDeck(filters, { enabled: mode === 'swipe' && !touring })
  const { update: updateSwipe } = swipe
  const deck = swipe.data?.deck
  const total = swipe.data?.total ?? 0

  // Feed's order sits in the address too (?sort=, left out for the default), so Back keeps it.
  const sort = sortOf(mode === 'feed' ? params.get('sort') : null).key
  const changeSort = (key) => {
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (key === DEFAULT_SORT) next.delete('sort')
        else next.set('sort', key)
        return next
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const feedQuery = useFeed(filters, search, sort, { enabled: mode === 'feed' })
  const feed = useMemo(() => {
    const pages = feedQuery.data?.pages
    if (!pages) return null
    const seen = new Set()
    const dishes = pages.flatMap((p) => p.dishes).filter((d) => !seen.has(d.id) && seen.add(d.id))
    return { dishes, total: pages[pages.length - 1].total }
  }, [feedQuery.data])
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedQuery
  const loadMoreFeed = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const error = actionError ?? (mode === 'swipe' ? swipe.error : feedQuery.error)

  // Swipe: top up the deck when it runs low. The next batch skips the cards still in the deck and the
  // ones just swiped; when that leaves nothing (a small catalog), it starts the loop again.
  const refill = useCallback(
    (remaining, recent) => {
      if (refilling.current) return
      refilling.current = true
      const left = remaining.map((d) => d.id)
      const ask = (exclude) => discoverPage({ filters, order: 'swipe', exclude, limit: SWIPE_PAGE })
      ask([...left, ...recent])
        .then((page) => (page.dishes.length || left.length ? page : ask(left)))
        .then(({ dishes, total }) =>
          updateSwipe((s) => {
            const have = new Set(s.deck.map((x) => x.id))
            return { ...s, total, deck: [...s.deck, ...dishes.filter((x) => !have.has(x.id))] }
          }),
        )
        .catch(setError)
        .finally(() => (refilling.current = false))
    },
    [filters, updateSwipe],
  )

  const decide = useCallback(
    (dish, action) => {
      const current = swipe.data
      if (!current) return
      const recent = [...current.recent.filter((id) => id !== dish.id), dish.id].slice(-RECENT_KEEP)
      const remaining = current.deck.filter((d) => d.id !== dish.id)
      updateSwipe((s) => ({ ...s, recent, deck: s.deck.filter((d) => d.id !== dish.id) }))
      if (remaining.length < REFILL_BELOW) refill(remaining, recent)
      recordSwipe(userId, dish.id, action, 'swipe').catch(setError)
      if (hasShared && seen < HINT_SWIPES) {
        try {
          localStorage.setItem(HINT_KEY, String(seen + 1))
        } catch {
          /* the hint just stays */
        }
        setSeen(seen + 1)
      }
      if (action === 'want') {
        const lists = targetsOrMySaves(targets)
        const added = targetIds(userId, targets).then((ids) => saveDish(dish.id, ids))
        added.then(() => refreshAfter('want')).catch(setError)
        clearTimeout(toastTimer.current)
        setToast({ dish, lists, added })
        toastTimer.current = setTimeout(() => setToast(null), hasShared ? UNDO_TOAST_MS : TOAST_MS)
      }
    },
    [userId, swipe.data, updateSwipe, refill, targets, hasShared, seen],
  )

  // Undo on the "Saved to …" toast takes back only the saves this swipe added.
  const undoSave = async () => {
    const { added } = toast
    clearTimeout(toastTimer.current)
    setToast(null)
    try {
      const saves = await added
      if (saves.length) await removeSaves(saves.map((s) => s.saveId))
      refreshAfter('want')
    } catch (e) {
      setError(e)
    }
  }

  const open = (dish) => navigate(`/dish/${dish.id}`, { state: { from: mode } })

  const n = filterCount(filters)
  const activeChips = [
    ...filters.tagIds.map((id) => tagsById.get(id)?.name),
    ...filters.budgets.map((id) => BUDGETS.find((b) => b.id === id)?.label),
    DISTANCES.find((d) => d.id === filters.distance)?.label,
  ].filter(Boolean)

  const practice = useMemo(() => practiceDish(tags), [tags])
  const onTourSkip = () => tourPhase === 'left' && setTourPhase('leftResult')
  const onTourWant = () => tourPhase === 'right' && setTourPhase('rightResult')
  const onTourOpen = () => tourPhase === 'view' && setTourPhase(TOUR_STEPS.view.next)

  if (error && !touring) return <div className="page"><ErrorNote error={error} /></div>
  if (!tags.length || (!touring && (mode === 'swipe' ? !deck : !feed))) return <Loader />

  const matched = mode === 'swipe' ? total : feed.total
  // With a search in Feed, an empty result is about the search, not the filters.
  const noMatches = n > 0 && matched === 0 && !(mode === 'feed' && search.trim())

  // Short phones get a tighter Swipe so the card and its buttons (and the Saving to row) fit on the
  // first screen (app.css, .discover--compact; .discover--targets adds room for Saving to).
  const withTargets = mode === 'swipe' && !touring && hasShared
  return (
    <div className={['page', mode === 'swipe' && !touring && 'discover--compact', withTargets && 'discover--targets'].filter(Boolean).join(' ')}>
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
          onChange={(m) => setParams(m === 'feed' ? { mode: 'feed', ...(query && { q: query }) } : {}, { replace: true })}
        />
        <button type="button" className="btn btn--blue btn--bar" onClick={() => setShowFilters(true)}>
          <Icon name="filter" />
          <span>Filters{n ? ` · ${n}` : ''}</span>
          <Icon name="chevron" className="push-right" />
        </button>
      </div>

      {/* Where Want it and a right swipe save, set once and changed now and then: under Filters, above
          the card (spec 3.5). */}
      {mode === 'swipe' && !touring && hasShared && deck?.length > 0 && (
        <SavingToRow targets={targets} onClick={() => setChoosing(true)} />
      )}

      {touring ? (
        <SwipeDeck
          dishes={[practice]}
          allow={TOUR_SWIPES[tourPhase] ?? []}
          onSkip={onTourSkip}
          onWant={onTourWant}
          onOpen={onTourOpen}
        />
      ) : noMatches ? (
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
        deck.length ? (
          <SwipeDeck
            dishes={deck}
            onSkip={(d) => decide(d, 'skip')}
            onWant={(d) => decide(d, 'want')}
            onOpen={open}
            hideHint={hasShared && seen >= HINT_SWIPES}
            toast={toast && (hasShared ? <SavedToast toast={toast} onUndo={undoSave} /> : <AddedToast dish={toast.dish} />)}
          />
        ) : (
          <EmptyState
            mascot="mug"
            title="No bites yet."
            actions={
              <Link to="/post" className="btn btn--gold btn--block">
                Post a dish
              </Link>
            }
          >
            New dishes show up as Anteaters share them.
          </EmptyState>
        )
      ) : (
        <Feed page={feed} query={query} setQuery={setQuery} onMore={loadMoreFeed} sort={sort} onSort={changeSort} />
      )}

      {choosing && <SaveToSheet mode="targets" onClose={() => setChoosing(false)} />}
      {(showFilters || tourPhase === 'filters') && <FilterSheet onClose={() => setShowFilters(false)} />}
    </div>
  )
}

// With shared lists: where the dish went, and Undo (the only button, as the old toast had only See list).
function SavedToast({ toast, onUndo }) {
  const [state, setState] = useState(null) // the saves added, once known
  useEffect(() => {
    let live = true
    toast.added.then((s) => live && setState(s)).catch(() => {})
    return () => {
      live = false
    }
  }, [toast.added])
  const already = state && !state.length
  return (
    <div className="added-toast" role="status">
      <div>
        <strong>{already ? 'Already in your lists' : `Saved to ${targetsText(toast.lists, { max: 28 })}`}</strong>
        <span>{toast.dish.restaurant.name} · keep exploring</span>
      </div>
      {!already && (
        <button
          type="button"
          className="added-toast__undo"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onUndo()
          }}
        >
          Undo
        </button>
      )}
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

// In the chosen order (Most saved by default), a page at a time (the database ranks and searches); the
// next page loads when the bottom of the list comes into view.
function Feed({ page, query, setQuery, onMore, sort, onSort }) {
  const end = useRef(null)
  const { dishes, total } = page
  const more = dishes.length < total
  const ids = useMemo(() => dishes.map((d) => d.id), [dishes])
  const savedIn = useSavedIn(ids).data // undefined while loading: the buttons wait

  useEffect(() => {
    if (!more || !end.current) return undefined
    const watch = new IntersectionObserver((entries) => entries[0].isIntersecting && onMore(), { rootMargin: '400px' })
    watch.observe(end.current)
    return () => watch.disconnect()
  }, [more, onMore])

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder="Dish, restaurant, or poster" label="Search dishes" />
      <div className="feed-head">
        <div className="feed-head__title">
          <h2 className="title title--sm">{sortOf(sort).heading}</h2>
          <span className="muted small">
            {total} dish{total === 1 ? '' : 'es'}
          </span>
        </div>
        <SortMenu value={sort} onChange={onSort} />
      </div>
      {dishes.length ? (
        <>
          <div className="feed-grid">
            {dishes.map((d) => (
              <DishCard key={d.id} dish={d} from="feed" listIds={savedIn?.get(d.id) ?? (savedIn ? [] : undefined)} />
            ))}
          </div>
          {more && (
            <p ref={end} className="muted small center" role="status">
              Finding more bites…
            </p>
          )}
        </>
      ) : (
        <p className="muted center">Nothing matches “{query}”. Try a dish, restaurant or poster name.</p>
      )}
    </>
  )
}
