// Shared Save Lists on the page side: list names, grouping one list's saves into dishes, where Want it
// saves to (the "save targets"), and the invite link a signed-out visitor opened.
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useApp } from './app'
import { getMyLists } from './api'
import { keys, queryClient, useMyLists } from './queries'

export const NAME_MAX = 40

export const listName = (list) => (list?.kind === 'personal' ? 'My Saves' : (list?.name ?? 'A shared list'))

export const memberWord = (n) => `${n} member${n === 1 ? '' : 's'}`

// One card per dish: a shared list has a row for each person who saved it. A deleted dish has no id, so
// its rows group by the names copied in when it was deleted.
export function groupItems(rows) {
  const items = new Map()
  for (const r of rows ?? []) {
    const key = r.deleted
      ? `gone:${r.dish.name}|${r.dish.restaurant.name ?? ''}|${r.dish.restaurant.address ?? ''}`
      : `dish:${r.dish.id}`
    let item = items.get(key)
    if (!item) {
      item = { key, id: r.id, dish: r.dish, deleted: r.deleted, savedAt: r.savedAt, tried: r.tried, saveIds: [], savers: [] }
      items.set(key, item)
    }
    item.saveIds.push(r.id)
    item.savers.push({ ...r.saver, savedAt: r.savedAt, tried: r.saverTried })
    if (r.savedAt > item.savedAt) item.savedAt = r.savedAt
  }
  for (const item of items.values()) item.savers.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
  return [...items.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

// "Saved by you" / "Saved by Lana" / "Saved by 3".
export function savedByText(savers, userId) {
  if (savers.length > 1) return `Saved by ${savers.length}`
  const [s] = savers
  if (!s) return ''
  return s.id === userId ? 'Saved by you' : `Saved by ${s.name.split(' ')[0]}`
}

// "My Saves + Weekend Food Hunt", or "2 lists" when the names won't fit.
export function targetsText(lists, { max = 34 } = {}) {
  const names = lists.map(listName)
  const joined = names.join(' + ')
  if (names.length < 2 || joined.length <= max) return joined
  return `${names.length} lists`
}

// ---- Save targets: where Swipe's right swipe and Want it save to ----
// Kept on this device per user (spec 3.5). Lists the user can't use any more drop out; with none left
// (or nothing stored yet) it is My Saves alone.

const targetsKey = (userId) => `zotmunch.saveTargets.${userId}`
const CHANGED = 'zotmunch:save-targets'

function readTargets(userId) {
  try {
    const ids = JSON.parse(localStorage.getItem(targetsKey(userId)) ?? 'null')
    return Array.isArray(ids) ? ids : null
  } catch {
    return null
  }
}

function subscribe(onChange) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGED, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGED, onChange)
  }
}

export function useSaveTargets() {
  const { userId, tourPhase } = useApp()
  const { data: lists } = useMyLists()
  const stored = useSyncExternalStore(subscribe, () => {
    try {
      return localStorage.getItem(targetsKey(userId))
    } catch {
      return null
    }
  })
  const personal = lists?.find((l) => l.kind === 'personal')
  const shared = useMemo(() => (lists ?? []).filter((l) => l.kind === 'shared'), [lists])

  const targets = useMemo(() => {
    if (!lists || !personal) return []
    if (tourPhase) return [personal] // the guide always saves (pretend) into My Saves
    const ids = stored ? (readTargets(userId) ?? []) : []
    const chosen = lists.filter((l) => ids.includes(l.id))
    return chosen.length ? chosen : [personal]
  }, [lists, personal, stored, userId, tourPhase])

  const setTargets = useCallback(
    (ids) => {
      try {
        localStorage.setItem(targetsKey(userId), JSON.stringify(ids))
      } catch {
        /* private mode: the choice lasts until the page reloads */
      }
      window.dispatchEvent(new Event(CHANGED))
    },
    [userId],
  )

  return { lists, personal, shared, hasShared: shared.length > 0, targets, setTargets, ready: Boolean(personal) }
}

// The list ids to save into now. Before the lists have loaded (a swipe right after opening the app),
// that's My Saves, fetched once.
export async function targetIds(userId, targets) {
  if (targets.length) return targets.map((t) => t.id)
  const lists = await queryClient.fetchQuery({ queryKey: keys.lists(userId), queryFn: getMyLists })
  return lists.filter((l) => l.kind === 'personal').map((l) => l.id)
}

const MY_SAVES = { kind: 'personal' }
export const targetsOrMySaves = (targets) => (targets.length ? targets : [MY_SAVES])

// ---- The invite link a signed-out visitor opened, kept through sign-in and onboarding ----

const JOIN_KEY = 'zotmunch.pendingJoin'

export function pendingJoin() {
  try {
    return sessionStorage.getItem(JOIN_KEY)
  } catch {
    return null
  }
}

export function setPendingJoin(token) {
  try {
    if (token) sessionStorage.setItem(JOIN_KEY, token)
    else sessionStorage.removeItem(JOIN_KEY)
  } catch {
    /* without session storage the visitor just opens the link again after signing in */
  }
}

// ---- Which list Saved opens by default ----

const lastListKey = (userId) => `zotmunch.savedList.${userId}`

export function lastList(userId) {
  try {
    return localStorage.getItem(lastListKey(userId))
  } catch {
    return null
  }
}

export function rememberList(userId, listId) {
  try {
    localStorage.setItem(lastListKey(userId), listId)
  } catch {
    /* fine: Saved opens My Saves next time */
  }
}
