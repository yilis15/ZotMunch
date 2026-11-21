import { supabase } from './supabase'

const MAX_SIDE = 1600
const SMALL_SIDE = 640 // cards and lists; the full photo is only for the dish page's carousel and viewer

// Seed photos ship with the app (public/seed/); everything else lives in the dish-photos bucket.
export function photoUrl(path) {
  if (!path) return null
  if (path.startsWith('seed/')) return `/${path}`
  return supabase.storage.from('dish-photos').getPublicUrl(path).data.publicUrl
}

// Every uploaded photo has a small copy next to it: {user_id}/{uuid}.jpg → {user_id}/{uuid}.sm.jpg.
export const smallPath = (path) => path.replace(/\.[^./]+$/, '.sm.jpg')

// The small copy's URL. Seed photos have none. Photos uploaded before small copies existed (and files
// the browser couldn't shrink) have none either, so <img>s using this fall back to photoUrl on error.
export function smallPhotoUrl(path) {
  if (!path) return null
  if (path.startsWith('seed/')) return photoUrl(path)
  return photoUrl(smallPath(path))
}

// onError for an <img> showing a small copy: switch to the full photo once.
export const fallBackTo = (full) => (e) => {
  if (full && e.currentTarget.src !== full) e.currentTarget.src = full
}

// PhotoPicker items for photos that are uploaded but not yet on a dish (drafts, carried-over posts).
export function photoItems(paths) {
  return paths.map((path) => ({ key: path, path, url: photoUrl(path), small: smallPhotoUrl(path) }))
}

function encode(bitmap, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

// Phone photos are often 5–12 MB; the bucket takes 5 MB. Re-encode as a JPEG no wider than 1600px, plus a
// 640px copy (`small`) for cards and lists. Browsers that can't decode the file (HEIC outside Safari)
// upload it as is, with no small copy.
export async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const [blob, small] = await Promise.all([encode(bitmap, MAX_SIDE, 0.85), encode(bitmap, SMALL_SIDE, 0.8)])
    bitmap.close()
    if (blob) return { blob, small, ext: 'jpg', type: 'image/jpeg' }
  } catch {
    // fall through
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  return { blob: file, small: null, ext, type: file.type || 'image/jpeg' }
}
