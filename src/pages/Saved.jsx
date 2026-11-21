// Saved (Figma 16, 17, 22): one list's dishes grouped by restaurant, each toggling Not yet ⇄ Tried it.
// The list picker switches between My Saves and shared lists (?list=); a shared list also shows its
// members, who saved each dish, and Share. Dishes leave the list by swiping a row right or via Select;
// either way there's a short Undo. Tried it belongs to each person and shows in every list.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { LIST_ERRORS, removeSaves, restoreSaves, setTried } from '../lib/api'
import { keys, queryClient, refreshAfter, useInvites, useListPage, useMyLists } from '../lib/queries'
import { groupItems, lastList, listName, memberWord, rememberList, savedByText, useSaveTargets } from '../lib/lists'
import { formatMiles } from '../lib/location'
import { priceLabel } from '../lib/discover'
import { practiceSave } from '../lib/tour'
import AddFromSavesDialog from '../components/AddFromSavesDialog'
import AvatarStack from '../components/AvatarStack'
import CreateListDialog from '../components/CreateListDialog'
import Icon from '../components/Icon'
import InviteBanner, { InviteCard } from '../components/InviteBanner'
import ListPicker from '../components/ListPicker'
import ListSettings from '../components/ListSettings'
import PickDialog from '../components/PickDialog'
import RemoveSavesDialog from '../components/RemoveSavesDialog'
import SaversDialog from '../components/SaversDialog'
import ShareDialog from '../components/ShareDialog'
import Sheet from '../components/Sheet'
import SwipeRow from '../components/SwipeRow'
import { Chip, DishPhoto, EmptyState, ErrorNote, Hero, Loader, Segmented } from '../components/ui'
import { DELETED_MASCOT } from '../lib/deleted'

const TABS = [['all', 'All'], ['not_yet', 'Not yet'], ['tried', 'Tried it']]
const UNDO_MS = 5000
const NOTICE_MS = 3500

// A deleted dish keeps only its restaurant's name and address, so it joins the card of a saved
// dish from the same place when there is one, and gets its own card otherwise.
function groupByRestaurant(items) {
  const place = (r) => `${r.name}|${r.address ?? ''}`
  const live = new Map(items.filter((s) => !s.deleted).map((s) => [place(s.dish.restaurant), s.dish.restaurant.id]))
  const groups = new Map()
  for (const s of items) {
    const r = s.dish.restaurant
    const key = s.deleted ? (live.get(place(r)) ?? `gone:${place(r)}`) : r.id
    if (!groups.has(key)) groups.set(key, { key, restaurant: r, items: [] })
    const group = groups.get(key)
    if (!s.deleted) group.restaurant = r
    group.items.push(s)
  }
  return [...groups.values()]
}

const newestFirst = (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
const dishCount = (n) => `${n} dish${n === 1 ? '' : 'es'}`
const tabOf = (item) => (item.tried ? 'tried' : 'not_yet')

// Figma: Saved · Unavailable. The dish is gone, so there's nothing to open or mark tried.
function DeletedSummary({ dish, hint }) {
  return (
    <>
      <img className="saved-row__photo saved-row__gone-art" src={`/mascots/${DELETED_MASCOT}.png`} alt="" />
      <div>
        <h3 className="dish-name dish-name--sm saved-row__gone-name">{dish.name}</h3>
        <p className="saved-row__gone-title">Post deleted</p>
        {hint && <p className="saved-row__gone-hint">Swipe right to remove</p>}
      </div>
    </>
  )
}

function DishSummary({ dish }) {
  return (
    <>
      <DishPhoto dish={dish} className="saved-row__photo" />
      <div>
        <h3 className="dish-name dish-name--sm">{dish.name}</h3>
        <p className="meta">{[priceLabel(dish.price), formatMiles(dish.distance)].filter(Boolean).join(' · ')}</p>
        {dish.practice && <Chip>Practice</Chip>}
      </div>
    </>
  )
}

function SavedBy({ item, userId, onOpen }) {
  return (
    <button type="button" className="saved-by" onClick={onOpen} aria-label={`${savedByText(item.savers, userId)}. See who`}>
      <AvatarStack people={item.savers} size={20} />
      <span>{savedByText(item.savers, userId)}</span>
    </button>
  )
}

export default function Saved() {
  const { userId, tags, tourPhase } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { state: navState, search } = useLocation()
  const { data: lists, error: listsError, isFetching: listsLoading } = useMyLists()
  const { data: invites = [] } = useInvites()
  const { targets, setTargets } = useSaveTargets()

  const personal = lists?.find((l) => l.kind === 'personal')
  const asked = params.get('list')
  const list = lists && (lists.find((l) => l.id === (asked ?? lastList(userId))) ?? personal)
  const shared = list?.kind === 'shared'
  const page = useListPage(list?.id)
  // Changes go straight into the cached list, so the page (and a later visit) shows them at once.
  const setRows = (change) => queryClient.setQueryData(keys.list(userId, list.id), (old) => change(old ?? []))

  const [tab, setTab] = useState('all')
  const [justTried, setJustTried] = useState(false)
  const [actionError, setError] = useState(null)
  const [openRow, setOpenRow] = useState(null) // item key of the row swiped open
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [undo, setUndo] = useState(null) // { ids, rows, count } just removed
  const [notice, setNotice] = useState(null)
  const [picking, setPicking] = useState(false) // the "Pick for me" reel is open
  const [confirming, setConfirming] = useState(null) // item keys waiting for "Remove?" to be answered
  const [dialog, setDialog] = useState(null) // 'create' | 'share' | 'settings' | 'add' | { savers } | { invites }
  const [askTargets, setAskTargets] = useState(null) // a list just joined: also save swipes to it?
  const [practiceTried, setPracticeTried] = useState(false)
  const undoTimer = useRef(null)
  const noticeTimer = useRef(null)

  const say = useCallback((text) => {
    clearTimeout(noticeTimer.current)
    setNotice(text)
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS)
  }, [])

  useEffect(
    () => () => {
      clearTimeout(undoTimer.current)
      clearTimeout(noticeTimer.current)
    },
    [],
  )

  const openList = useCallback(
    (id) => {
      setParams(id && id !== personal?.id ? { list: id } : {}, { replace: true })
      if (id) rememberList(userId, id)
      setTab('all')
      setSelecting(false)
      setSelected(new Set())
      setOpenRow(null)
      setJustTried(false)
    },
    [setParams, personal?.id, userId],
  )

  // A list in the address that isn't one of mine (removed, deleted, never joined): say so, open My Saves.
  const lostList =
    (lists && !listsLoading && asked && !lists.some((l) => l.id === asked)) || page.error?.code === 'ZM010'
  useEffect(() => {
    if (!lostList) return
    say(LIST_ERRORS.ZM010)
    openList(personal?.id)
    refreshAfter('members')
  }, [lostList, say, openList, personal?.id])

  useEffect(() => {
    if (list) rememberList(userId, list.id)
  }, [list, userId])

  // Just joined from an invite link (Join.jsx): welcome, and offer to save swipes there too.
  const joined = navState?.joined
  useEffect(() => {
    if (!joined) return
    say('You’re on the list!')
    setAskTargets(joined)
    navigate({ search }, { replace: true, state: null })
  }, [joined, say, navigate, search])

  // Touching anywhere outside the open row closes it.
  useEffect(() => {
    if (!openRow) return
    const onDown = (e) => !e.target.closest('.swipe-row--open') && setOpenRow(null)
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [openRow])

  // The guide's Saved step adds the practice dish to My Saves for display only; it's never stored.
  const items = useMemo(() => {
    const grouped = page.data ? groupItems(page.data) : null
    if (tourPhase === 'saved' && !shared) return [{ ...practiceSave(tags), tried: practiceTried }, ...(grouped ?? [])]
    return grouped
  }, [page.data, tourPhase, shared, tags, practiceTried])

  const toggle = async (item) => {
    const next = !item.tried
    setJustTried(next)
    if (item.dish.practice) return setPracticeTried(next)
    const update = (tried) =>
      setRows((all) =>
        all.map((r) =>
          !r.deleted && r.dish.id === item.dish.id
            ? { ...r, tried, saverTried: r.saver.id === userId ? tried : r.saverTried }
            : r,
        ),
      )
    update(next)
    try {
      await setTried(item.dish.id, next)
      refreshAfter('tried')
    } catch (e) {
      update(item.tried)
      setError(e)
    }
  }

  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  const remove = async (itemKeys) => {
    const chosen = new Set(itemKeys)
    const gone = (items ?? []).filter((i) => chosen.has(i.key) && !i.dish.practice)
    const ids = gone.flatMap((i) => i.saveIds)
    if (!ids.length) return
    const idSet = new Set(ids)
    const rows = (page.data ?? []).filter((r) => idSet.has(r.id))
    setRows((all) => all.filter((r) => !idSet.has(r.id)))
    setOpenRow(null)
    stopSelecting()
    clearTimeout(undoTimer.current)
    setUndo(null)
    try {
      const n = await removeSaves(ids)
      refreshAfter('saveChange')
      if (!n) {
        say(gone.length === 1 ? 'This dish was already removed.' : 'These dishes were already removed.')
        return
      }
      setUndo({ ids, rows, count: gone.length })
      undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
    } catch (e) {
      setRows((all) => [...all, ...rows].sort(newestFirst))
      setError(e)
    }
  }

  const undoRemove = async () => {
    const { ids, rows } = undo
    clearTimeout(undoTimer.current)
    setUndo(null)
    setRows((all) => [...all, ...rows].sort(newestFirst))
    try {
      await restoreSaves(ids)
      refreshAfter('saveChange')
      refreshAfter('want')
    } catch (e) {
      setRows((all) => all.filter((r) => !ids.includes(r.id)))
      setError(e)
    }
  }

  // "Keep" in the Remove dialog: nothing changes; a row swiped open closes, picked dishes stay picked.
  const keepSaves = useCallback(() => {
    setConfirming(null)
    setOpenRow(null)
  }, [])

  const answered = (invite, accepted) => {
    setDialog(null)
    if (!accepted) return say('Invitation declined.')
    openList(invite.listId)
    say('You’re on the list!')
    setAskTargets(invite)
  }

  const error = actionError ?? listsError ?? (lostList ? null : page.error)

  const toast = undo ? (
    <div className="floating-bar floating-bar--dark" role="status">
      <span>{dishCount(undo.count)} removed</span>
      <button type="button" className="floating-bar__action" onClick={undoRemove}>
        Undo
      </button>
    </div>
  ) : (
    notice && (
      <div className="floating-bar floating-bar--dark" role="status">
        <span>{notice}</span>
      </div>
    )
  )

  const dialogs = (
    <>
      {dialog === 'create' && (
        <CreateListDialog
          onClose={() => setDialog(null)}
          onCreated={(id) => {
            openList(id)
            setDialog('share')
          }}
        />
      )}
      {dialog === 'share' && list?.kind === 'shared' && (
        <ShareDialog list={list} userId={userId} onClose={() => setDialog(null)} />
      )}
      {dialog === 'settings' && list?.kind === 'shared' && (
        <ListSettings
          list={list}
          userId={userId}
          onClose={() => setDialog(null)}
          onGone={() => {
            setDialog(null)
            openList(personal?.id)
          }}
        />
      )}
      {dialog === 'add' && shared && personal && (
        <AddFromSavesDialog
          personal={personal}
          list={list}
          inList={new Set((items ?? []).filter((i) => !i.deleted).map((i) => i.dish.id))}
          onClose={() => setDialog(null)}
          onAdded={(n) => {
            setDialog(null)
            say(`${dishCount(n)} added. Your personal saves stay put.`)
          }}
        />
      )}
      {dialog?.savers && <SaversDialog item={dialog.savers} userId={userId} onClose={() => setDialog(null)} />}
      {dialog?.invites && (
        <Sheet title="Invitations" subtitle="Lists your friends want to plan with you." onClose={() => setDialog(null)}>
          <div className="invite-stack">
            {dialog.invites.map((inv) => (
              <InviteCard key={inv.listId} invite={inv} onAnswered={answered} />
            ))}
          </div>
        </Sheet>
      )}
    </>
  )

  // Invitations and the "also save swipes here?" question sit right under the title; the list picker and
  // the members row go under Pick for me (or under the tabs when there's nothing to pick from).
  const notices = lists && list && (
    <>
      <InviteBanner invites={invites} onAnswered={answered} onReview={() => setDialog({ invites })} />
      {askTargets && (
        <div className="banner banner--gold ask-targets" role="status">
          <strong>Also save your swipes to {askTargets.name}?</strong>
          <span>Right swipes and Want it will go there too.</span>
          <div className="ask-targets__actions">
            <button type="button" className="btn btn--outline" onClick={() => setAskTargets(null)}>
              Not now
            </button>
            <button
              type="button"
              className="btn btn--gold"
              onClick={() => {
                setTargets([...new Set([...targets.map((t) => t.id), askTargets.listId])])
                setAskTargets(null)
              }}
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </>
  )
  const listBar = lists && list && (
    <>
      <ListPicker
        lists={lists}
        current={list}
        invites={invites}
        onPick={openList}
        onInvite={(inv) => setDialog({ invites: [inv] })}
        onCreate={() => setDialog('create')}
      />
      {shared && (
        <div className="list-members">
          <button type="button" className="list-members__who" onClick={() => setDialog('share')}>
            <AvatarStack people={list.members} total={list.memberCount} size={28} />
            <span>{memberWord(list.memberCount)}</span>
          </button>
          <div className="list-members__actions">
            <button type="button" className="btn btn--blue btn--sm list-members__invite" onClick={() => setDialog('share')}>
              <Icon name="users" size={18} /> Invite
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--soft list-members__settings"
              onClick={() => setDialog('settings')}
              aria-label="List settings"
            >
              <Icon name="settings" size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )

  if (!lists || !list || (!items && !page.error)) {
    return error ? <div className="page"><ErrorNote error={error} /></div> : <Loader label="Opening your food list…" />
  }

  if (!items?.length) {
    return (
      <div className="page">
        {shared ? (
          <Hero eyebrow="Saved / Your next stops" title={<>A little list.<br />A lot to munch.</>} mascot="mug" />
        ) : (
          <Hero eyebrow="Saved / Your food journal" title={<>Your next<br />craving lives here.</>} />
        )}
        {notices}
        {listBar}
        <ErrorNote error={error} />
        {shared ? (
          <EmptyState
            mascot="cookie"
            framed
            title="Start adding places together."
            actions={
              <>
                <button type="button" className="btn btn--gold btn--block" onClick={() => setDialog('add')}>
                  Add from My Saves
                </button>
                <button type="button" className="btn btn--outline btn--block" onClick={() => navigate('/')}>
                  Discover a munch
                </button>
              </>
            }
          >
            Save dishes here from Swipe or a dish page.
          </EmptyState>
        ) : (
          <EmptyState
            mascot="sleep"
            framed
            title="Nothing saved… yet!"
            actions={
              <button type="button" className="btn btn--gold btn--block" onClick={() => navigate('/')}>
                Discover dishes
              </button>
            }
          >
            Tap Want it on a dish to start your delicious little to-do list.
          </EmptyState>
        )}
        {toast}
        {dialogs}
      </div>
    )
  }

  const shown = items.filter((s) => tab === 'all' || tabOf(s) === tab)
  const gone = items.filter((s) => s.deleted).length
  const toTry = items.filter((s) => !s.deleted && !s.tried).length
  const allSelected = shown.length > 0 && shown.every((s) => selected.has(s.key))
  // "Pick for me" draws from this tab's dishes that still exist (not the guide's practice dish).
  const pickable = shown.filter((s) => !s.deleted && !s.dish.practice)

  const toggleSelected = (key) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className={selecting || undo || notice ? 'page page--bar' : 'page'}>
      {tab === 'tried' ? (
        <Hero eyebrow="Saved / Good memories" title={<>Been there.<br />Munched that.</>} mascot="cookie" />
      ) : (
        <Hero eyebrow="Saved / Your next stops" title={<>A little list.<br />A lot to munch.</>} mascot="mug" />
      )}
      {notices}
      <Segmented
        label="Saved filter"
        options={TABS}
        value={tab}
        onChange={(t) => {
          setTab(t)
          setSelected(new Set())
        }}
      />
      {pickable.length >= 2 && !selecting && (
        <button type="button" className="btn btn--gold btn--block pick-btn" onClick={() => setPicking(true)}>
          <span aria-hidden="true">🎲</span> Pick for me
        </button>
      )}
      {listBar}
      <div className="saved-toolbar">
        <p className="muted small">
          {items.length} saved · {gone ? `${gone} unavailable` : `${toTry} still to try`}
        </p>
        {selecting ? (
          <div className="saved-toolbar__actions">
            <button
              type="button"
              className="link-btn"
              onClick={() => setSelected(allSelected ? new Set() : new Set(shown.map((s) => s.key)))}
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button type="button" className="link-btn" onClick={stopSelecting}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setOpenRow(null)
              setSelecting(true)
            }}
          >
            Select
          </button>
        )}
      </div>
      <ErrorNote error={error} />

      {justTried && !selecting && (
        <div className="banner" role="status">
          <strong>One more happy bite, checked off.</strong>
          <span>{shared ? 'It shows as tried in all your lists.' : 'You can change this any time.'}</span>
        </div>
      )}

      <div className="saved-grid">
        {groupByRestaurant(shown).map(({ key, restaurant, items: group }) => (
          <section key={key} className={restaurant.id ? 'card saved-group' : 'card saved-group saved-group--gone'}>
            {restaurant.id ? (
              <Link to={`/restaurant/${restaurant.id}`} className="saved-group__head">
                <h2 className="title title--xs">{restaurant.name}</h2>
                <p className="meta">{restaurant.address?.split(' · ')[0]}</p>
              </Link>
            ) : (
              <div className="saved-group__head">
                <h2 className="title title--xs">{restaurant.name}</h2>
                <p className="meta">{restaurant.address?.split(' · ')[0]}</p>
              </div>
            )}
            {group.map((s) =>
              selecting ? (
                <button
                  key={s.key}
                  type="button"
                  className="saved-row saved-row--select"
                  aria-pressed={selected.has(s.key)}
                  onClick={() => toggleSelected(s.key)}
                >
                  <span className="checkbox" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                  <span className="saved-row__dish">
                    {s.deleted ? <DeletedSummary dish={s.dish} /> : <DishSummary dish={s.dish} />}
                  </span>
                </button>
              ) : s.deleted ? (
                <SwipeRow
                  key={s.key}
                  label={s.dish.name}
                  open={openRow === s.key}
                  onOpenChange={(isOpen) => setOpenRow(isOpen ? s.key : null)}
                  onRemove={() => setConfirming([s.key])}
                >
                  <div className="saved-row saved-row--gone">
                    <div className="saved-row__dish">
                      <DeletedSummary dish={s.dish} hint />
                    </div>
                  </div>
                </SwipeRow>
              ) : (
                <SwipeRow
                  key={s.key}
                  label={s.dish.name}
                  open={openRow === s.key}
                  onOpenChange={(isOpen) => setOpenRow(isOpen ? s.key : null)}
                  onRemove={() => setConfirming([s.key])}
                >
                  <div className="saved-row">
                    <div className="saved-row__main">
                      <Link to={`/dish/${s.dish.id}`} className="saved-row__dish">
                        <DishSummary dish={s.dish} />
                      </Link>
                      {shared && <SavedBy item={s} userId={userId} onOpen={() => setDialog({ savers: s })} />}
                    </div>
                    <button
                      type="button"
                      className={s.tried ? 'btn btn--blue btn--sm' : 'btn btn--outline btn--sm'}
                      aria-pressed={s.tried}
                      onClick={() => toggle(s)}
                    >
                      {s.tried ? 'Tried it ✓' : 'Not yet'}
                    </button>
                  </div>
                </SwipeRow>
              ),
            )}
          </section>
        ))}
      </div>
      {!shown.length && (
        <p className="muted center">{tab === 'tried' ? 'Nothing checked off yet.' : 'Everything here is tried. Nice!'}</p>
      )}
      {shared && !selecting && (
        <button type="button" className="btn btn--outline btn--block" onClick={() => setDialog('add')}>
          Add from My Saves
        </button>
      )}
      {tab === 'tried' && !selecting && (
        <button type="button" className="btn btn--gold btn--block" onClick={() => navigate('/')}>
          Find your next spot
        </button>
      )}

      {selecting && (
        <div className="floating-bar">
          <span>{selected.size} selected</span>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={!selected.size}
            onClick={() => setConfirming([...selected])}
          >
            Remove{selected.size ? ` ${dishCount(selected.size)}` : ''}
          </button>
        </div>
      )}
      {!selecting && toast}
      {picking && <PickDialog saves={pickable} shared={shared} userId={userId} onClose={() => setPicking(false)} />}
      {confirming && (
        <RemoveSavesDialog
          saves={items.filter((s) => confirming.includes(s.key))}
          listName={shared ? listName(list) : null}
          onRemove={() => {
            setConfirming(null)
            remove(confirming)
          }}
          onKeep={keepSaves}
        />
      )}
      {dialogs}
    </div>
  )
}
