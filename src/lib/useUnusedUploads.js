import { useEffect, useRef } from 'react'
import { removeStoragePhotos } from './api'

// Photos upload as soon as they're picked, before anything refers to them. When the form closes
// without using them, their files go too. Call the returned function once the form's photos are
// saved or handed to another page. Closing the browser tab can't be caught, so those files stay.
export function useUnusedUploads(photos) {
  const latest = useRef(photos)
  const used = useRef(false)

  useEffect(() => {
    latest.current = photos
  }, [photos])

  useEffect(
    () => () => {
      if (used.current) return
      const paths = latest.current.filter((p) => p.fresh && p.path).map((p) => p.path)
      removeStoragePhotos(paths).catch(() => {})
    },
    [],
  )

  return () => {
    used.current = true
  }
}
