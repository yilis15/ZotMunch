// Dishes their posters deleted.

// Art for a deleted dish (Figma: Saved · Unavailable), in public/mascots/.
export const DELETED_MASCOT = 'post-deleted'

// `.single()` found no row: for a dish link, its poster deleted it.
export const isMissing = (error) => error?.code === 'PGRST116'
