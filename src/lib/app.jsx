// App-wide state: the signed-in session, their profile and preferences, the tag list, and Discover filters.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { completeTour, getPreferenceTagIds, getProfile, getTags } from './api'
import { EMPTY_FILTERS } from './discover'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [profile, setProfile] = useState(null)
  const [preferenceTagIds, setPreferenceTagIds] = useState([])
  const [tags, setTags] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  // Failures here used to leave pages on their loading screen forever; RequireAuth shows these instead.
  const [loadError, setLoadError] = useState(null)
  const [tourPhase, setTourPhase] = useState(null) // the first-time guide's current step (lib/tour.js)
  const tourClosed = useRef(false) // closed this session, so a failed save doesn't reopen it

  const loadTags = useCallback(() => getTags().then(setTags), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    loadTags().catch(setLoadError)
    return () => data.subscription.unsubscribe()
  }, [loadTags])

  const userId = session?.user.id

  const reloadProfile = useCallback(async () => {
    if (!userId) return
    const [p, prefs] = await Promise.all([getProfile(userId), getPreferenceTagIds(userId)])
    setProfile(p)
    setPreferenceTagIds(prefs)
  }, [userId])

  // Try again after a failed load: profile, preferences, and tags.
  const retryLoad = useCallback(async () => {
    setLoadError(null)
    try {
      await Promise.all([reloadProfile(), loadTags()])
    } catch (e) {
      setLoadError(e)
    }
  }, [reloadProfile, loadTags])

  useEffect(() => {
    setProfile(null)
    setPreferenceTagIds([])
    setLoadError(null)
    setTourPhase(null)
    tourClosed.current = false
    if (userId) reloadProfile().catch(setLoadError)
  }, [userId, reloadProfile])

  // New users get the guide once. AppShell shows it, so it waits until after Everyday preferences.
  useEffect(() => {
    if (profile && !profile.tour_completed_at && !tourClosed.current) {
      setTourPhase((phase) => phase ?? 'discover')
    }
  }, [profile])

  const startTour = useCallback(() => setTourPhase('discover'), [])

  // Skipping counts as seen. Replaying from Me changes nothing. A failed save just shows it again next visit.
  const endTour = useCallback(() => {
    tourClosed.current = true
    setTourPhase(null)
    if (profile && !profile.tour_completed_at) {
      completeTour(profile.id).then(reloadProfile).catch(() => {})
    }
  }, [profile, reloadProfile])

  const value = useMemo(
    () => ({
      session,
      userId,
      email: session?.user.email,
      profile,
      preferenceTagIds,
      reloadProfile,
      loadError,
      retryLoad,
      tags,
      tagsById: new Map(tags.map((t) => [t.id, t])),
      filters,
      setFilters,
      tourPhase,
      setTourPhase,
      startTour,
      endTour,
    }),
    [session, userId, profile, preferenceTagIds, reloadProfile, loadError, retryLoad, tags, filters, tourPhase, startTour, endTour],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
