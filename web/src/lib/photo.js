import { supabase } from './supabase'

// Seed photos ship with the app (public/seed/); everything else lives in the dish-photos bucket.
export function photoUrl(path) {
  if (!path) return null
  if (path.startsWith('seed/')) return `/${path}`
  return supabase.storage.from('dish-photos').getPublicUrl(path).data.publicUrl
}
