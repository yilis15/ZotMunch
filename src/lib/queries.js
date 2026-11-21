// The data cache (React Query). Pages read through these hooks instead of fetching in their own effects,
// so coming back to a page shows what it had at once instead of loading it again. Every read still goes
// through api.js. After a write, call refreshAfter(kind, …) so only the cached data it changed reloads.
import { useCallback } from 'react'
import { keepPreviousData, QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useApp } from './app'
import { supabase } from './supabase'
import {
  discoverCount,
  discoverPage,
  getDish,
  getDraft,
  getDrafts,
  getMyPosts,
  getMyReview,
  getMyReviews,
  getDishLists,
  getInvites,
  getListMembers,
  getListPage,
  getMyLists,
  getPerson,
  getRestaurant,
  getSavedIn,
} from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // within a minute, coming back to a page doesn't fetch again
      gcTime: 10 * 60_000, // data no page uses is dropped after ten minutes
      refetchOnWindowFocus: false, // switching tabs back doesn't reshuffle what's on screen
      retry: 1,
    },
  },
})

// Signing out empties the cache, so whoever signs in next on this browser starts clean.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') queryClient.clear()
})

// Every cache key in one place. The first part names the kind of data, so refreshAfter can clear a kind.
export const keys = {
  dish: (id) => ['dish', id],
  lists: (userId) => ['lists', userId],
  list: (userId, listId) => ['list', userId, listId],
  members: (listId) => ['members', listId],
  invites: (userId) => ['invites', userId],
  dishLists: (userId, dishId) => ['dishLists', userId, dishId],
  savedIn: (userId, dishIds) => ['savedIn', userId, dishIds],
  restaurant: (id) => ['restaurant', id],
  person: (id) => ['person', id],
  myPosts: (userId) => ['myPosts', userId],
  myReviews: (userId) => ['myReviews', userId],
  myReview: (userId, dishId) => ['myReview', userId, dishId],
  drafts: (userId) => ['drafts', userId],
  draft: (id) => ['draft', id],
  discoverCount: (userId, filters, prefs) => ['discoverCount', userId, filters, prefs],
  feed: (userId, filters, search, sort, prefs) => ['feed', userId, filters, search, sort, prefs],
  swipeDeck: (userId, filters, prefs) => ['swipeDeck', userId, filters, prefs],
}

export function useDish(id, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.dish(id), queryFn: () => getDish(id), enabled: enabled && Boolean(id) })
}

// Shared lists change under other people's hands, so they go stale sooner and reload when the tab
// comes back into view.
const SHARED = { staleTime: 30_000, refetchOnWindowFocus: true }

// The signed-in user's lists, My Saves first.
export function useMyLists() {
  const { userId } = useApp()
  return useQuery({ queryKey: keys.lists(userId), queryFn: getMyLists, enabled: Boolean(userId), ...SHARED })
}

// Every save in one list (see getListPage).
export function useListPage(listId) {
  const { userId } = useApp()
  return useQuery({
    queryKey: keys.list(userId, listId),
    queryFn: () => getListPage(listId),
    enabled: Boolean(listId),
    ...SHARED,
  })
}

export function useListMembers(listId, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.members(listId),
    queryFn: () => getListMembers(listId),
    enabled: enabled && Boolean(listId),
    ...SHARED,
  })
}

// Invitations waiting for an answer: the Saved banner and the dot on the Saved tab.
export function useInvites() {
  const { userId } = useApp()
  return useQuery({ queryKey: keys.invites(userId), queryFn: getInvites, enabled: Boolean(userId), ...SHARED })
}

// Which of my lists have this dish, and whether I tried it (Dish detail).
export function useDishLists(dishId, { enabled = true } = {}) {
  const { userId } = useApp()
  return useQuery({
    queryKey: keys.dishLists(userId, dishId),
    queryFn: () => getDishLists(userId, dishId),
    enabled: enabled && Boolean(dishId),
  })
}

// Feed: which of my lists hold each dish on screen, in one read for all the cards.
export function useSavedIn(dishIds) {
  const { userId } = useApp()
  return useQuery({
    queryKey: keys.savedIn(userId, dishIds),
    queryFn: () => getSavedIn(dishIds),
    enabled: Boolean(userId) && dishIds.length > 0,
    placeholderData: keepPreviousData, // more cards loading keeps the buttons as they were
  })
}

export function usePerson(id) {
  return useQuery({ queryKey: keys.person(id), queryFn: () => getPerson(id), enabled: Boolean(id) })
}

export function useRestaurant(id) {
  return useQuery({ queryKey: keys.restaurant(id), queryFn: () => getRestaurant(id) })
}

export function useMyPosts() {
  const { userId } = useApp()
  return useQuery({ queryKey: keys.myPosts(userId), queryFn: () => getMyPosts(userId) })
}

export function useMyReviews() {
  const { userId } = useApp()
  return useQuery({ queryKey: keys.myReviews(userId), queryFn: () => getMyReviews(userId) })
}

export function useDrafts() {
  const { userId } = useApp()
  return useQuery({ queryKey: keys.drafts(userId), queryFn: () => getDrafts(userId) })
}

// Forms fill their fields once from these, so they read through the cache without staying subscribed:
// a fresh copy (under a minute old, and not cleared by a write since) is used as is.
export const loadDish = (id) => queryClient.fetchQuery({ queryKey: keys.dish(id), queryFn: () => getDish(id) })
export const loadMyReview = (userId, dishId) =>
  queryClient.fetchQuery({ queryKey: keys.myReview(userId, dishId), queryFn: () => getMyReview(userId, dishId) })
export const loadDraft = (id) => queryClient.fetchQuery({ queryKey: keys.draft(id), queryFn: () => getDraft(id) })

// The filter sheet's "Show N dishes".
export function useDiscoverCount(filters) {
  const { userId, preferenceTagIds } = useApp()
  return useQuery({
    queryKey: keys.discoverCount(userId, filters, preferenceTagIds),
    queryFn: () => discoverCount(filters),
    placeholderData: keepPreviousData, // the last count stays while the next loads
  })
}

export const FEED_PAGE = 24

// Feed, a page at a time; the pages already loaded stay when the user comes back.
export function useFeed(filters, search, sort, { enabled = true } = {}) {
  const { userId, preferenceTagIds } = useApp()
  return useInfiniteQuery({
    queryKey: keys.feed(userId, filters, search, sort, preferenceTagIds),
    queryFn: ({ pageParam }) => discoverPage({ filters, order: sort, query: search, limit: FEED_PAGE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.dishes.length, 0)
      return loaded < last.total ? loaded : undefined
    },
    enabled,
    placeholderData: keepPreviousData, // the last results stay on screen while a new search loads
  })
}

export const SWIPE_PAGE = 20

// Swipe: { deck, total, recent } — the cards still to come, how many match in all, and the ids swiped
// lately (newest last). It lives in the cache, not the page, so opening a dish and coming back keeps
// the deck where it was. It never goes stale on its own; new filters or preferences make a new key,
// and refreshAfter clears it when dishes are deleted. Change it with the returned `update`.
export function useSwipeDeck(filters, { enabled = true } = {}) {
  const { userId, preferenceTagIds } = useApp()
  const queryKey = keys.swipeDeck(userId, filters, preferenceTagIds)
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { dishes, total } = await discoverPage({ filters, order: 'swipe', limit: SWIPE_PAGE })
      return { deck: dishes, total, recent: [] }
    },
    enabled,
    staleTime: Infinity,
  })
  const update = useCallback(
    (change) => queryClient.setQueryData(queryKey, (old) => old && change(old)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key's parts are its real inputs
    [userId, filters, preferenceTagIds],
  )
  return { ...query, update }
}

// What each kind of write changes, as the kinds of cached data to load again.
const STALE_AFTER = {
  want: ['list', 'lists', 'dishLists', 'savedIn', 'dish', 'feed', 'person'], // save count moves too
  saveChange: ['lists', 'dishLists', 'savedIn', 'dish', 'feed', 'person'], // remove, undo (Saved updates its own cached list)
  tried: ['list', 'dishLists'], // Tried it shows in every list
  lists: ['lists', 'savedIn'], // create, rename, delete
  members: ['members', 'lists', 'list', 'invites', 'savedIn'], // invite, join, leave, remove
  post: ['myPosts', 'dish', 'restaurant', 'person', 'feed', 'discoverCount', 'drafts', 'draft', 'myReview'],
  deletePosts: ['myPosts', 'myReviews', 'list', 'dishLists', 'savedIn', 'person', 'dish', 'restaurant', 'feed', 'discoverCount', 'swipeDeck'],
  review: ['dish', 'myReviews', 'myReview', 'feed', 'restaurant'],
  deleteReviews: ['dish', 'myReviews', 'myReview', 'feed', 'restaurant'],
  draft: ['drafts', 'draft'],
  profile: ['dish'], // reviewer names and avatars
  preferences: ['feed', 'discoverCount', 'swipeDeck'],
}

// Resolves once the pages on screen have their fresh copies (await it before opening a list just made).
export function refreshAfter(kind) {
  return Promise.all((STALE_AFTER[kind] ?? []).map((k) => queryClient.invalidateQueries({ queryKey: [k] })))
}
