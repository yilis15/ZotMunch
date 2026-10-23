// Every Supabase query the pages use. Pages get plain objects back and never build queries themselves.
import { supabase } from './supabase'
import { photoUrl } from './photo'
import { getOrigin } from './location'

const DISH_FIELDS = `
  id, name, price, spice_level, created_at,
  restaurant:restaurants (id, name, address),
  dish_tags (tag_id),
  dish_photos (storage_path, review_id),
  reviews (rating)`

// users.email is column-protected, so profile reads must list columns.
const PROFILE_FIELDS = 'id, display_name, avatar_url, uci_verified, onboarding_completed_at'

const FEED_LIMIT = 50
const NEARBY_METERS = 50000

function check({ data, error }) {
  if (error) throw error
  return data
}

function toDish(row) {
  const ratings = row.reviews.map((r) => r.rating)
  const mainPhoto = row.dish_photos.find((p) => !p.review_id) ?? row.dish_photos[0]
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    spiceLevel: row.spice_level ?? 0,
    createdAt: row.created_at,
    restaurant: row.restaurant,
    tagIds: row.dish_tags.map((t) => t.tag_id),
    photo: photoUrl(mainPhoto?.storage_path),
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
    distance: null,
    saveCount: 0,
  }
}

// Distance and "Loved by N" come from two RPCs and are merged onto the dishes.
async function withExtras(dishes) {
  if (!dishes.length) return dishes
  const { lat, lng } = await getOrigin()
  const [near, counts] = await Promise.all([
    supabase.rpc('dishes_near', { p_lat: lat, p_lng: lng, p_meters: NEARBY_METERS }).then(check),
    supabase.rpc('dish_save_counts', { p_dish_ids: dishes.map((d) => d.id) }).then(check),
  ])
  const distance = new Map(near.map((n) => [n.dish_id, n.distance_m]))
  const saves = new Map(counts.map((c) => [c.dish_id, c.save_count]))
  return dishes.map((d) => ({ ...d, distance: distance.get(d.id) ?? null, saveCount: saves.get(d.id) ?? 0 }))
}

// ---- Tags & profile ----

export async function getTags() {
  return check(await supabase.from('tags').select('id, category, name').order('id'))
}

export async function getProfile(userId) {
  return check(await supabase.from('users').select(PROFILE_FIELDS).eq('id', userId).single())
}

export async function getPreferenceTagIds(userId) {
  const rows = check(await supabase.from('user_preference_tags').select('tag_id').eq('user_id', userId))
  return rows.map((r) => r.tag_id)
}

export async function savePreferences(userId, tagIds) {
  check(await supabase.from('user_preference_tags').delete().eq('user_id', userId))
  if (tagIds.length) {
    check(await supabase.from('user_preference_tags').insert(tagIds.map((tag_id) => ({ user_id: userId, tag_id }))))
  }
  check(await supabase.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', userId))
}

// ---- Dishes ----

export async function getDishes() {
  const rows = check(
    await supabase.from('dishes').select(DISH_FIELDS).order('created_at', { ascending: false }).limit(FEED_LIMIT),
  )
  return withExtras(rows.map(toDish))
}

export async function getDish(id) {
  const row = check(
    await supabase
      .from('dishes')
      .select(`${DISH_FIELDS}, review_list:reviews (id, rating, body, created_at, author:users (display_name))`)
      .eq('id', id)
      .single(),
  )
  const [dish] = await withExtras([toDish(row)])
  const reviews = [...row.review_list].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { ...dish, reviews }
}

export async function createReview(userId, dishId, rating, body, photos) {
  const uploadedPaths = []
  let review

  try {
    for (const photo of photos) {
      const extension = photo.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
      const path = `${userId}/${dishId}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('dish-photos').upload(path, photo, {
        contentType: photo.type,
        upsert: false,
      })
      if (error) throw error
      uploadedPaths.push(path)
    }

    review = check(
      await supabase
        .from('reviews')
        .insert({ user_id: userId, dish_id: dishId, rating, body: body.trim() || null })
        .select('id')
        .single(),
    )
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage.from('dish-photos').remove(uploadedPaths)
      if (cleanupError) {
        throw new Error(`${error.message ?? error}; photo cleanup failed: ${cleanupError.message}`)
      }
    }
    throw error
  }

  if (!uploadedPaths.length) return { review, photoError: null }

  try {
    check(
      await supabase.from('dish_photos').insert(
        uploadedPaths.map((storage_path) => ({
          storage_path,
          dish_id: dishId,
          review_id: review.id,
        })),
      ),
    )
    return { review, photoError: null }
  } catch (photoError) {
    const { error: cleanupError } = await supabase.storage.from('dish-photos').remove(uploadedPaths)
    const message = cleanupError
      ? `${photoError.message ?? photoError}; photo cleanup failed: ${cleanupError.message}`
      : photoError.message ?? String(photoError)
    return { review, photoError: message }
  }
}

export async function getRestaurant(id) {
  const restaurant = check(await supabase.from('restaurants').select('id, name, address').eq('id', id).single())
  const rows = check(await supabase.from('dishes').select(DISH_FIELDS).eq('restaurant_id', id))
  const dishes = await withExtras(rows.map(toDish))
  dishes.sort((a, b) => b.saveCount - a.saveCount || (b.rating ?? 0) - (a.rating ?? 0))
  return { ...restaurant, dishes }
}

// ---- Swipes & saves ----

// Dishes already skipped or wanted. A "view" alone keeps the dish in the Swipe deck.
export async function getSwipedDishIds(userId) {
  const rows = check(
    await supabase.from('swipes').select('dish_id').eq('user_id', userId).in('action', ['skip', 'want']),
  )
  return new Set(rows.map((r) => r.dish_id))
}

export async function recordSwipe(userId, dishId, action, mode) {
  check(await supabase.from('swipes').insert({ user_id: userId, dish_id: dishId, action, mode }))
}

// "Want it": tapping twice keeps the existing save (and its Tried it status).
export async function wantDish(userId, dishId) {
  check(
    await supabase
      .from('saves')
      .upsert({ user_id: userId, dish_id: dishId }, { onConflict: 'user_id,dish_id', ignoreDuplicates: true }),
  )
}

export async function getSaves(userId) {
  const rows = check(
    await supabase
      .from('saves')
      .select(`status, saved_at, tried_at, dish:dishes (${DISH_FIELDS})`)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false }),
  )
  const dishes = await withExtras(rows.map((r) => toDish(r.dish)))
  return rows.map((r, i) => ({ status: r.status, savedAt: r.saved_at, triedAt: r.tried_at, dish: dishes[i] }))
}

export async function getSaveStatus(userId, dishId) {
  const rows = check(
    await supabase.from('saves').select('status').eq('user_id', userId).eq('dish_id', dishId),
  )
  return rows[0]?.status ?? null
}

export async function setSaveStatus(userId, dishId, status) {
  const tried_at = status === 'tried' ? new Date().toISOString() : null
  check(await supabase.from('saves').update({ status, tried_at }).eq('user_id', userId).eq('dish_id', dishId))
}
