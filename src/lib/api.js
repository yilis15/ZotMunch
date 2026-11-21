// Every Supabase query the pages use. Pages get plain objects back and never build queries themselves.
import { supabase } from './supabase'
import { photoUrl, shrinkImage, smallPath, smallPhotoUrl } from './photo'
import { getOrigin } from './location'
import { BUDGETS, DISTANCES } from './discover'

const DISH_FIELDS = `
  id, name, price, created_at, created_by,
  poster:users!dishes_created_by_fkey (display_name, avatar_url),
  restaurant:restaurants (id, name, address, google_place_id),
  dish_tags (tag_id, added_by),
  dish_photos (id, storage_path, review_id, position, created_at),
  avg_rating, review_count, save_count`

const PHOTO_BUCKET = 'dish-photos'

// users.email is column-protected, so profile reads must list columns.
const PROFILE_FIELDS = 'id, display_name, avatar_url, uci_verified, onboarding_completed_at, tour_completed_at'

// List RPCs raise their own codes (migration 29); the page shows these words instead.
export const LIST_ERRORS = {
  ZM010: 'This list is no longer available to you.',
  ZM011: 'This invitation is no longer available.',
  ZM012: 'You can have up to 20 shared lists.',
  ZM013: 'The owner can’t leave. Delete the list instead.',
  ZM014: 'My Saves can’t be shared.',
}

function check({ data, error }) {
  if (error) {
    if (LIST_ERRORS[error.code]) error.message = LIST_ERRORS[error.code]
    throw error
  }
  return data
}

// Oldest upload first, then the order within one upload, so the poster's first photo is the cover.
const photoOrder = (a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.position - b.position

const toPhoto = (p) => ({
  id: p.id,
  path: p.storage_path,
  url: photoUrl(p.storage_path),
  small: smallPhotoUrl(p.storage_path),
  reviewId: p.review_id,
})

// avg_rating, review_count and save_count are kept on the dish by database triggers (migration 26).
function toDish(row) {
  const photos = [...row.dish_photos].sort(photoOrder).map(toPhoto)
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    createdAt: row.created_at,
    createdBy: row.created_by,
    poster: row.poster ? { name: row.poster.display_name, avatar: row.poster.avatar_url } : null,
    restaurant: row.restaurant,
    tagIds: row.dish_tags.map((t) => t.tag_id),
    tagAddedBy: new Map(row.dish_tags.map((t) => [t.tag_id, t.added_by])),
    photos,
    photo: photos[0]?.url ?? null,
    photoSmall: photos[0]?.small ?? null,
    rating: row.avg_rating == null ? null : Number(row.avg_rating),
    reviewCount: row.review_count,
    distance: null,
    saveCount: row.save_count,
  }
}

// Distance comes from an RPC, for just these dishes, and is merged onto them.
async function withExtras(dishes) {
  if (!dishes.length) return dishes
  const { lat, lng } = await getOrigin()
  const near = check(
    await supabase.rpc('dish_distances', { p_lat: lat, p_lng: lng, p_dish_ids: dishes.map((d) => d.id) }),
  )
  const distance = new Map(near.map((n) => [n.dish_id, n.distance_m]))
  return dishes.map((d) => ({ ...d, distance: distance.get(d.id) ?? null }))
}

// ---- Tags & profile ----

export async function getTags() {
  return check(await supabase.from('tags').select('id, category, name').order('id'))
}

// A signed-in account whose users row was deleted gets it rebuilt instead of a profile that never loads.
export async function getProfile(userId) {
  const read = async () => check(await supabase.from('users').select(PROFILE_FIELDS).eq('id', userId).maybeSingle())
  const profile = await read()
  if (profile) return profile
  check(await supabase.rpc('ensure_my_profile'))
  const rebuilt = await read()
  if (!rebuilt) throw new Error("We couldn't set up your profile. Try signing out and back in.")
  return rebuilt
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

export async function completeTour(userId) {
  check(await supabase.from('users').update({ tour_completed_at: new Date().toISOString() }).eq('id', userId))
}

// ---- Dishes ----

// Discover's filters as discover_dishes arguments (see lib/discover.js for what they mean).
function discoverArgs(filters, lat, lng) {
  const budgets = BUDGETS.filter((b) => filters.budgets.includes(b.id))
  return {
    p_lat: lat,
    p_lng: lng,
    p_tag_ids: filters.tagIds,
    p_price_min: budgets.map((b) => b.min),
    p_price_max: budgets.map((b) => (Number.isFinite(b.max) ? b.max : null)),
    p_max_meters: DISTANCES.find((d) => d.id === filters.distance)?.meters ?? null,
  }
}

// One page of Discover, ranked by the database: allergens hidden, more of the user's diets first, then
// nearer. 'swipe' puts never-swiped dishes first, then the longest-ago swiped; 'feed' puts the most saved
// first. Returns the page's dishes in that order and how many dishes match in all.
export async function discoverPage({ filters, order, query = '', exclude = [], limit = 20, offset = 0 }) {
  const { lat, lng } = await getOrigin()
  const ranked = check(
    await supabase.rpc('discover_dishes', {
      ...discoverArgs(filters, lat, lng),
      p_query: query.trim() || null,
      p_order: order,
      p_exclude: exclude,
      p_limit: limit,
      p_offset: offset,
    }),
  )
  const total = ranked[0]?.total ?? 0
  if (!ranked.length) return { dishes: [], total }
  const rows = check(await supabase.from('dishes').select(DISH_FIELDS).in('id', ranked.map((r) => r.dish_id)))
  const byId = new Map(rows.map((r) => [r.id, toDish(r)]))
  const dishes = ranked
    .filter((r) => byId.has(r.dish_id)) // a dish deleted between the two reads drops out
    .map((r) => ({ ...byId.get(r.dish_id), distance: r.distance_m }))
  return { dishes, total }
}

// How many dishes these filters would show, for the filter panel's "Show N dishes".
export async function discoverCount(filters) {
  const { lat, lng } = await getOrigin()
  const rows = check(await supabase.rpc('discover_dishes', { ...discoverArgs(filters, lat, lng), p_limit: 1 }))
  return rows[0]?.total ?? 0
}

const REVIEW_FIELDS = `id, rating, body, created_at, updated_at, user_id,
  author:users (display_name, avatar_url),
  photos:dish_photos (id, storage_path, review_id, position, created_at)`

function toReview(r) {
  return {
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userId: r.user_id,
    author: r.author,
    photos: [...(r.photos ?? [])].sort(photoOrder).map(toPhoto),
  }
}

export async function getDish(id) {
  const row = check(
    await supabase.from('dishes').select(`${DISH_FIELDS}, review_list:reviews (${REVIEW_FIELDS})`).eq('id', id).single(),
  )
  const [dish] = await withExtras([toDish(row)])
  const reviews = row.review_list.map(toReview).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { ...dish, reviews }
}

export async function getRestaurant(id) {
  const restaurant = check(await supabase.from('restaurants').select('id, name, address').eq('id', id).single())
  const rows = check(await supabase.from('dishes').select(DISH_FIELDS).eq('restaurant_id', id))
  const dishes = await withExtras(rows.map(toDish))
  dishes.sort((a, b) => b.saveCount - a.saveCount || (b.rating ?? 0) - (a.rating ?? 0))
  return { ...restaurant, dishes }
}

// A poster's page (/people/:id): their name and avatar (never the email) and every dish they posted,
// newest first. person is null when there's no such account.
export async function getPerson(id) {
  const [person, rows] = await Promise.all([
    supabase.from('users').select('id, display_name, avatar_url').eq('id', id).maybeSingle(),
    supabase.from('dishes').select(DISH_FIELDS).eq('created_by', id).order('created_at', { ascending: false }),
  ])
  const p = check(person)
  return {
    person: p && { id: p.id, name: p.display_name, avatar: p.avatar_url },
    dishes: await withExtras(check(rows).map(toDish)),
  }
}

// ---- Swipes & saves ----

export async function recordSwipe(userId, dishId, action, mode) {
  check(await supabase.from('swipes').insert({ user_id: userId, dish_id: dishId, action, mode }))
}

// ---- Lists (migration 29) ----
// My Saves is a list too (kind 'personal'). Clients only read lists, members and saves; every write is
// an RPC that checks the caller is a member, so nobody can write into a list they aren't in.

const toList = (r) => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  ownerId: r.owner_id,
  role: r.role,
  memberCount: r.member_count,
  members: r.members ?? [],
  lastSavedAt: r.last_saved_at,
})

export async function getMyLists() {
  return check(await supabase.rpc('my_lists')).map(toList)
}

export async function createList(name) {
  return check(await supabase.rpc('create_list', { p_name: name.trim() }))
}

export async function renameList(listId, name) {
  check(await supabase.rpc('rename_list', { p_list: listId, p_name: name.trim() }))
}

export async function deleteList(listId) {
  check(await supabase.rpc('delete_list', { p_list: listId }))
}

// Active members (Owner first, then by joining) and invitations still waiting, for the Share dialog.
export async function getListMembers(listId) {
  const rows = check(
    await supabase
      .from('list_members')
      .select('user_id, role, status, invited_by, created_at, joined_at, user:users!list_members_user_id_fkey (display_name, avatar_url)')
      .eq('list_id', listId),
  )
  const people = rows.map((r) => ({
    id: r.user_id,
    role: r.role,
    status: r.status,
    invitedBy: r.invited_by,
    since: r.joined_at ?? r.created_at,
    name: r.user?.display_name ?? 'Former member',
    avatar: r.user?.avatar_url,
  }))
  const byJoin = (a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : a.since.localeCompare(b.since))
  return {
    members: people.filter((p) => p.status === 'active').sort(byJoin),
    pending: people.filter((p) => p.status !== 'active').sort(byJoin),
  }
}

export async function findPeople(listId, query) {
  const rows = check(await supabase.rpc('find_people', { p_list: listId, p_q: query }))
  return rows.map((r) => ({ id: r.id, name: r.display_name, avatar: r.avatar_url, email: r.email, relation: r.relation }))
}

export async function invitePeople(listId, userIds) {
  return check(await supabase.rpc('invite_people', { p_list: listId, p_user_ids: userIds }))
}

export async function answerInvite(listId, accept) {
  check(await supabase.rpc('answer_invite', { p_list: listId, p_accept: accept }))
}

export async function cancelInvite(listId, userId) {
  check(await supabase.rpc('cancel_invite', { p_list: listId, p_user: userId }))
}

export async function removeMember(listId, userId) {
  check(await supabase.rpc('remove_member', { p_list: listId, p_user: userId }))
}

export async function leaveList(listId) {
  check(await supabase.rpc('leave_list', { p_list: listId }))
}

export async function getInvites() {
  const rows = check(await supabase.rpc('my_invites'))
  return rows.map((r) => ({
    listId: r.list_id,
    name: r.name,
    inviter: r.inviter_id ? { id: r.inviter_id, name: r.inviter_name, avatar: r.inviter_avatar } : null,
    memberCount: r.member_count,
    invitedAt: r.invited_at,
  }))
}

export const inviteUrl = (token) => `${window.location.origin}/join/${token}`

export async function getInviteLink(listId) {
  return inviteUrl(check(await supabase.rpc('get_invite_link', { p_list: listId })))
}

export async function resetInviteLink(listId) {
  return inviteUrl(check(await supabase.rpc('reset_invite_link', { p_list: listId })))
}

// status: 'ok' | 'unavailable' | 'already_member' | 'owner'.
export async function previewInvite(token) {
  const [r] = check(await supabase.rpc('preview_invite', { p_token: token }))
  return {
    status: r?.status ?? 'unavailable',
    listId: r?.list_id,
    name: r?.name,
    owner: r?.owner_name ? { name: r.owner_name, avatar: r.owner_avatar } : null,
    memberCount: r?.member_count,
  }
}

export async function joinByLink(token) {
  return check(await supabase.rpc('join_by_link', { p_token: token }))
}

// ---- Saves ----

// A save whose dish its poster deleted has no dish, only the name and restaurant copied in at the time.
function deletedDish(row) {
  return {
    id: null,
    name: row.dish_name,
    restaurant: { id: null, name: row.restaurant_name, address: row.restaurant_address },
  }
}

// Every save in one list, newest first: one row per person per dish (lib/lists.js groups them).
// tried is the caller's own Tried it; saverTried is the saver's.
export async function getListPage(listId) {
  const rows = check(await supabase.rpc('list_page', { p_list: listId }))
  const ids = [...new Set(rows.filter((r) => r.dish_id).map((r) => r.dish_id))]
  const dishRows = ids.length ? check(await supabase.from('dishes').select(DISH_FIELDS).in('id', ids)) : []
  const live = await withExtras(dishRows.map(toDish))
  const byId = new Map(live.map((d) => [d.id, d]))
  return rows
    .filter((r) => !r.dish_id || byId.has(r.dish_id)) // a dish deleted between the two reads drops out
    .map((r) => ({
      id: r.save_id,
      listId,
      savedAt: r.saved_at,
      deleted: !r.dish_id,
      dish: r.dish_id ? byId.get(r.dish_id) : deletedDish(r),
      saver: { id: r.user_id, name: r.saver_name ?? 'Former member', avatar: r.saver_avatar },
      saverTried: r.saver_tried,
      tried: r.me_tried,
    }))
}

// Which of the caller's lists have this dish (and who saved it there), and whether they tried it.
export async function getDishLists(userId, dishId) {
  const [saves, tried] = await Promise.all([
    supabase
      .from('saves')
      .select('id, list_id, user_id, saver:users!saves_user_id_fkey (display_name)')
      .eq('dish_id', dishId)
      .is('removed_at', null),
    supabase.from('tried_dishes').select('dish_id').eq('user_id', userId).eq('dish_id', dishId),
  ])
  const rows = check(saves)
  return {
    saves: rows.map((r) => ({ id: r.id, listId: r.list_id, userId: r.user_id, name: r.saver?.display_name })),
    tried: check(tried).length > 0,
  }
}

// Feed cards: which of my lists hold each of these dishes (RLS shows only my lists). Map<dishId, listId[]>.
export async function getSavedIn(dishIds) {
  const out = new Map(dishIds.map((id) => [id, []]))
  if (!dishIds.length) return out
  const rows = check(await supabase.from('saves').select('dish_id, list_id').in('dish_id', dishIds).is('removed_at', null))
  for (const r of rows) {
    const ids = out.get(r.dish_id)
    if (ids && !ids.includes(r.list_id)) ids.push(r.list_id)
  }
  return out
}

// Want it / swipe right into every list given. Returns only the saves added now ({ listId, saveId }),
// so Undo takes back exactly those; a dish already in a list stays as it was.
export async function saveDish(dishId, listIds) {
  const rows = check(await supabase.rpc('save_dish', { p_dish: dishId, p_list_ids: listIds }))
  return rows.map((r) => ({ listId: r.list_id, saveId: r.save_id }))
}

// Manage lists: the dish ends up in exactly these lists (unchecked shared lists lose it for everyone).
export async function setDishLists(dishId, listIds) {
  check(await supabase.rpc('set_dish_lists', { p_dish: dishId, p_list_ids: listIds }))
}

// Add from My Saves. Returns how many dishes were added.
export async function addDishes(listId, dishIds) {
  return check(await supabase.rpc('add_dishes', { p_list: listId, p_dish_ids: dishIds }))
}

// Soft remove (any member, any save in their lists). Returns how many were still there.
export async function removeSaves(saveIds) {
  return check(await supabase.rpc('remove_saves', { p_save_ids: saveIds }))
}

// Undo: only the caller's own removals from the last hour come back.
export async function restoreSaves(saveIds) {
  return check(await supabase.rpc('restore_saves', { p_save_ids: saveIds }))
}

export async function setTried(dishId, tried) {
  check(await supabase.rpc('set_tried', { p_dish: dishId, p_tried: tried }))
}

// ---- Photos ----

// A file name never changes content (each upload gets a new uuid), so browsers and the CDN may keep it a year.
const PHOTO_CACHE = { cacheControl: '31536000' }

// Uploads into the user's own folder ({user_id}/{uuid}.jpg) and returns the storage path. The small copy
// goes up first: once the content check has passed the photo, the bucket refuses new small copies for it.
export async function uploadPhoto(userId, file) {
  const { blob, small, ext, type } = await shrinkImage(file)
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  if (small) {
    check(await supabase.storage.from(PHOTO_BUCKET).upload(smallPath(path), small, { ...PHOTO_CACHE, contentType: 'image/jpeg' }))
  }
  check(await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { ...PHOTO_CACHE, contentType: type }))
  return path
}

// Removes photos and their small copies (a missing small copy is simply skipped by Storage).
export async function removeStoragePhotos(paths) {
  const own = paths.filter((p) => p && !p.startsWith('seed/'))
  if (own.length) check(await supabase.storage.from(PHOTO_BUCKET).remove(own.flatMap((p) => [p, smallPath(p)])))
}

// ---- Post ----

// Same rule as dishes.name_normalized: trimmed, inner spaces collapsed, lowercased.
export function normalizeDishName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

export async function findDishByName(restaurantId, name, exceptDishId) {
  let query = supabase
    .from('dishes')
    .select(DISH_FIELDS)
    .eq('restaurant_id', restaurantId)
    .eq('name_normalized', normalizeDishName(name))
  if (exceptDishId) query = query.neq('id', exceptDishId)
  const rows = check(await query.limit(1))
  return rows[0] ? toDish(rows[0]) : null
}

export async function searchRestaurants(text) {
  return check(
    await supabase
      .from('restaurants')
      .select('id, name, address')
      .ilike('name', `%${text.replace(/[%_]/g, '')}%`)
      .order('name')
      .limit(8),
  )
}

export async function upsertRestaurant(place) {
  const id = check(
    await supabase.rpc('upsert_restaurant', {
      p_google_place_id: place.googlePlaceId,
      p_name: place.name,
      p_address: place.address,
      p_lat: place.lat,
      p_lng: place.lng,
      p_price_level: place.priceLevel,
    }),
  )
  return check(await supabase.from('restaurants').select('id, name, address').eq('id', id).single())
}

// ---- Content check ----

// Asks the check-post Edge Function whether new photos are food and safe and whether text is clean.
// Returns { photos: { [path]: 'ok' | 'not_food' | 'unsafe' }, texts: { [field]: 'ok' | 'unsafe' } }.
// The publish RPCs refuse anything this hasn't passed, so a failure here means "can't publish yet".
export async function checkContent({ photoPaths = [], texts = {} }) {
  if (!photoPaths.length && !Object.keys(texts).length) return { photos: {}, texts: {} }
  const { data, error } = await supabase.functions.invoke('check-post', { body: { photoPaths, texts } })
  if (!error) return data
  const status = error.context?.status
  const failure = new Error(error.message)
  failure.code = status === 429 ? 'moderation_busy' : 'moderation_unavailable'
  throw failure
}

// Which fields and photos a check turned down: { photos: Map(path → verdict), texts: { field: true } }.
export function rejectedIn(result) {
  const photos = new Map(Object.entries(result.photos ?? {}).filter(([, v]) => v !== 'ok'))
  const texts = Object.fromEntries(Object.entries(result.texts ?? {}).filter(([, v]) => v !== 'ok').map(([f]) => [f, true]))
  return { photos, texts, any: photos.size > 0 || Object.keys(texts).length > 0 }
}

export async function publishPost({ restaurantId, name, price, rating, body, tagIds, photoPaths, draftId }) {
  return check(
    await supabase.rpc('publish_post', {
      p_restaurant_id: restaurantId,
      p_name: name,
      p_price: price,
      p_rating: rating,
      p_body: body,
      p_tag_ids: tagIds,
      p_photo_paths: photoPaths,
      p_draft_id: draftId ?? null,
    }),
  )
}

export async function updatePost({ dishId, restaurantId, name, price, rating, body, tagIds, addPhotoPaths, removePhotoIds }) {
  check(
    await supabase.rpc('update_post', {
      p_dish_id: dishId,
      p_restaurant_id: restaurantId,
      p_name: name,
      p_price: price,
      p_tag_ids: tagIds,
      p_add_photo_paths: addPhotoPaths,
      p_remove_photo_ids: removePhotoIds,
      p_rating: rating,
      p_body: body,
    }),
  )
}

export async function getMyPosts(userId) {
  const rows = check(
    await supabase.from('dishes').select(DISH_FIELDS).eq('created_by', userId).order('created_at', { ascending: false }),
  )
  return withExtras(rows.map(toDish))
}

// ---- Reviews ----

export async function getMyReview(userId, dishId) {
  const rows = check(await supabase.from('reviews').select(REVIEW_FIELDS).eq('dish_id', dishId).eq('user_id', userId))
  return rows[0] ? toReview(rows[0]) : null
}

export async function submitReview({ dishId, rating, body, addTagIds = [], removeTagIds = [], photoPaths = [], removePhotoIds = [] }) {
  return check(
    await supabase.rpc('submit_review', {
      p_dish_id: dishId,
      p_rating: rating,
      p_body: body,
      p_add_tag_ids: addTagIds,
      p_remove_tag_ids: removeTagIds,
      p_photo_paths: photoPaths,
      p_remove_photo_ids: removePhotoIds,
    }),
  )
}

export async function getMyReviews(userId) {
  const rows = check(
    await supabase
      .from('reviews')
      .select(`${REVIEW_FIELDS}, dish:dishes (${DISH_FIELDS})`)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
  )
  return rows.map((r) => ({ ...toReview(r), dish: toDish(r.dish) }))
}

// Deletes the poster's own dishes. The database removes their reviews, photo records, tags and swipes,
// and keeps other people's saves as "Post deleted". Afterwards the poster's own photo files go too;
// other reviewers' files sit in their folders, which only they can delete.
export async function deletePosts(userId, dishIds) {
  const photos = check(
    await supabase.from('dish_photos').select('storage_path').in('dish_id', dishIds).eq('uploader_id', userId),
  )
  check(await supabase.from('dishes').delete().in('id', dishIds).eq('created_by', userId))
  removeStoragePhotos(photos.map((p) => p.storage_path)).catch(() => {})
}

// Deletes the user's own reviews; their photo records go with them, then their photo files.
export async function deleteReviews(userId, reviews) {
  check(await supabase.from('reviews').delete().in('id', reviews.map((r) => r.id)).eq('user_id', userId))
  removeStoragePhotos(reviews.flatMap((r) => r.photos.map((p) => p.path))).catch(() => {})
}

// ---- Drafts ----

const DRAFT_FIELDS = 'id, name, price, rating, body, tag_ids, photo_paths, updated_at, restaurant:restaurants (id, name, address)'

function toDraft(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    price: row.price,
    rating: row.rating,
    body: row.body ?? '',
    tagIds: row.tag_ids,
    photoPaths: row.photo_paths,
    updatedAt: row.updated_at,
    restaurant: row.restaurant,
  }
}

export async function getDrafts(userId) {
  const rows = check(
    await supabase.from('post_drafts').select(DRAFT_FIELDS).eq('user_id', userId).order('updated_at', { ascending: false }),
  )
  return rows.map(toDraft)
}

export async function getDraft(id) {
  return toDraft(check(await supabase.from('post_drafts').select(DRAFT_FIELDS).eq('id', id).single()))
}

// Inserts a new draft or updates an existing one; returns its id.
export async function saveDraft({ id, restaurantId, name, price, rating, body, tagIds, photoPaths }) {
  const row = {
    restaurant_id: restaurantId ?? null,
    name: name || null,
    price: price ?? null,
    rating: rating ?? null,
    body: body || null,
    tag_ids: tagIds,
    photo_paths: photoPaths,
  }
  const query = id
    ? supabase.from('post_drafts').update(row).eq('id', id).select('id').single()
    : supabase.from('post_drafts').insert(row).select('id').single()
  return check(await query).id
}

// A draft's photos aren't used anywhere else, so their files go too.
export async function deleteDraft(draft) {
  check(await supabase.from('post_drafts').delete().eq('id', draft.id))
  await removeStoragePhotos(draft.photoPaths).catch(() => {})
}

// ---- Profile ----

export async function updateProfile(userId, { displayName, avatarUrl }) {
  check(await supabase.from('users').update({ display_name: displayName, avatar_url: avatarUrl }).eq('id', userId))
}
