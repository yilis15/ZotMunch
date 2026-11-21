// Photos field (Figma 11): thumbnails plus an "Add more photos" tile. Files upload as soon as they're
// picked; each item is { key, url, path?, id?, uploading?, failed?, fresh?, rejected? } — `id` marks a photo already on the
// dish; `fresh` marks a file nothing else refers to yet, so removing it here deletes the file too.
import { useEffect, useRef } from 'react'
import { removeStoragePhotos, uploadPhoto } from '../lib/api'
import { fallBackTo } from '../lib/photo'
import Icon from './Icon'

// What the content check said about a photo it turned down (`rejected` on the item).
const REJECTED = {
  not_food: "This doesn't look like food",
  unsafe: "This photo isn't allowed",
}

export default function PhotoPicker({ userId, photos, setPhotos, label = 'Photos' }) {
  const input = useRef(null)
  const dropped = useRef(new Set()) // keys removed while still uploading
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const add = (files) => {
    for (const file of files) {
      const key = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setPhotos((all) => [...all, { key, url: preview, uploading: true, fresh: true }])
      uploadPhoto(userId, file)
        .then((path) => {
          if (dropped.current.has(key) || !mounted.current) {
            removeStoragePhotos([path]).catch(() => {})
            return
          }
          setPhotos((all) => all.map((p) => (p.key === key ? { ...p, path, uploading: false } : p)))
        })
        .catch(() => setPhotos((all) => all.map((p) => (p.key === key ? { ...p, uploading: false, failed: true } : p))))
    }
  }

  const remove = (photo) => {
    if (photo.uploading) dropped.current.add(photo.key)
    else if (photo.fresh && photo.path) removeStoragePhotos([photo.path]).catch(() => {})
    setPhotos((all) => all.filter((p) => p.key !== photo.key))
  }

  return (
    <div className="photo-picker">
      {photos.map((p) => (
        <div
          key={p.key}
          className={p.failed ? 'photo-tile photo-tile--failed' : p.rejected ? 'photo-tile photo-tile--rejected' : 'photo-tile'}
        >
          <img src={p.small ?? p.url} onError={fallBackTo(p.url)} alt="" />
          {p.uploading && <span className="photo-tile__status">Uploading…</span>}
          {p.failed && <span className="photo-tile__status">Upload failed</span>}
          {p.rejected && (
            <span className="photo-tile__status photo-tile__status--rejected" role="alert">
              {REJECTED[p.rejected]}
            </span>
          )}
          <button type="button" className="photo-tile__remove" onClick={() => remove(p)} aria-label="Remove photo">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="photo-add" onClick={() => input.current?.click()}>
        <Icon name="photo" />
        <span>{photos.length ? 'Add more photos' : 'Add photos'}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label={label}
        onChange={(e) => {
          add([...e.target.files])
          e.target.value = ''
        }}
      />
    </div>
  )
}
