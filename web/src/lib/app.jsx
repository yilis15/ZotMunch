// App-wide state: the signed-in session, their profile and preferences, the tag list, and Discover filters.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { getPreferenceTagIds, getProfile, getTags } from './api'
import { EMPTY_FILTERS } from './discover'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [profile, setProfile] = useState(null)
  const [preferenceTagIds, setPreferenceTagIds] = useState([])
  const [tags, setTags] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    getTags().then(setTags)
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const reloadProfile = useCallback(async () => {
    if (!userId) return
    const [p, prefs] = await Promise.all([getProfile(userId), getPreferenceTagIds(userId)])
    setProfile(p)
    setPreferenceTagIds(prefs)
  }, [userId])

  useEffect(() => {
    setProfile(null)
    setPreferenceTagIds([])
    if (userId) reloadProfile()
  }, [userId, reloadProfile])

  const value = useMemo(
    () => ({
      session,
      userId,
      email: session?.user.email,
      profile,
      preferenceTagIds,
      reloadProfile,
      tags,
      tagsById: new Map(tags.map((t) => [t.id, t])),
      filters,
      setFilters,
    }),
    [session, userId, profile, preferenceTagIds, reloadProfile, tags, filters],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
