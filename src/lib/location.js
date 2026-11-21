// Where distances are measured from: the browser's position if allowed, else the middle of UCI.
export const UCI_CENTER = { lat: 33.6405, lng: -117.8443 }

let origin = null

export function getOrigin() {
  if (origin) return origin
  origin = new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(UCI_CENTER)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(UCI_CENTER),
      { timeout: 4000, maximumAge: 10 * 60 * 1000 },
    )
  })
  return origin
}

export function formatMiles(meters) {
  if (meters == null) return null
  const mi = meters / 1609.34
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`
}
