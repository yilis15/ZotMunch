// Google Places (New) for the Post page's restaurant search. Without a GOOGLE_MAPS_API_KEY
// (or VITE_GOOGLE_MAPS_API_KEY) the picker searches restaurants already in our database instead.
import { getOrigin } from './location'

const KEY = import.meta.env.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY
export const hasGooglePlaces = Boolean(KEY)

// Google returns only 5 suggestions. Restricted to all of California it picked the 5 best-known
// Blaze Pizzas in the state (Palm Springs, Fremont…), never the one on Campus Drive, so searches
// prefer places near the user (or UCI) and keep the California check. Only when nothing nearby or in
// California matches do they fall back to the whole state, whose box also covers bits of Nevada,
// Arizona, and Mexico. The check reads "Irvine, CA, USA", "CA, USA", or "California, …".
const NEARBY_RADIUS_M = 5000
const CALIFORNIA = { south: 32.5, west: -124.5, north: 42.0, east: -114.1 }
const IN_CALIFORNIA = /(^|, )(CA|California)(,|\s|$)/

// Always English, whatever the browser's language: a Chinese browser got "尔湾加利福尼亚美国", which the
// California check dropped, and the address saved for a restaurant is shown to everyone.
let placesLib = null
function loadPlaces() {
  if (!placesLib) {
    placesLib = new Promise((resolve, reject) => {
      window.__zotmunchMapsReady = resolve
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly&language=en&region=US&loading=async&callback=__zotmunchMapsReady`
      script.async = true
      script.onerror = () => reject(new Error('Google Maps could not load. Check the API key.'))
      document.head.append(script)
    }).then(() => window.google.maps.importLibrary('places'))
    placesLib.catch(() => {
      placesLib = null
    })
  }
  return placesLib
}

// One token per search, shared by the suggestions and the details call (Google bills them as one session).
export async function newPlacesSession() {
  const { AutocompleteSessionToken } = await loadPlaces()
  return new AutocompleteSessionToken()
}

export async function suggestPlaces(input, sessionToken) {
  const [{ AutocompleteSuggestion }, origin] = await Promise.all([loadPlaces(), getOrigin()])
  // No place-type filter: tea, boba, and dessert shops have their own types.
  const search = async (area) => {
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken,
      ...area,
      includedRegionCodes: ['us'],
      origin,
    })
    return suggestions
      .map((s) => s.placePrediction)
      .filter((p) => p && IN_CALIFORNIA.test(p.secondaryText?.text ?? p.text.text))
  }
  let found = await search({ locationBias: { center: origin, radius: NEARBY_RADIUS_M } })
  if (!found.length) found = await search({ locationRestriction: CALIFORNIA })
  return found
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity))
    .map((p) => ({
      key: p.placeId,
      name: p.mainText?.text ?? p.text.text,
      address: p.secondaryText?.text ?? '',
      prediction: p,
    }))
}

// Only Essentials-tier fields. Google bills the whole call at the priciest field's tier, and priceLevel
// alone would make every pick an Enterprise request (1,000 free a month instead of 10,000).
export async function placeDetails(prediction) {
  const place = prediction.toPlace()
  await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] })
  return {
    googlePlaceId: place.id,
    name: place.displayName,
    address: place.formattedAddress,
    lat: place.location.lat(),
    lng: place.location.lng(),
    priceLevel: null,
  }
}
