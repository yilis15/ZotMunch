// Restaurant field (Figma 11): type a name, pick the branch. Google Places when a key is set,
// otherwise restaurants already in the database.
import { useEffect, useRef, useState } from 'react'
import { searchRestaurants, upsertRestaurant } from '../lib/api'
import { hasGooglePlaces, newPlacesSession, placeDetails, suggestPlaces } from '../lib/places'
import Icon from './Icon'

export default function RestaurantPicker({ value, onChange, invalid }) {
  const [text, setText] = useState(value?.name ?? '')
  const [options, setOptions] = useState([])
  const [state, setState] = useState('idle') // idle | searching | picking | error
  const [error, setError] = useState(null)
  const session = useRef(null)
  const [typed, setTyped] = useState(false) // only search after the user types, not when a draft fills the field

  useEffect(() => {
    const q = text.trim()
    if (!typed || q.length < 2) {
      setOptions([])
      return undefined
    }
    let live = true
    const timer = setTimeout(async () => {
      setState('searching')
      try {
        let found
        if (hasGooglePlaces) {
          session.current ??= await newPlacesSession()
          found = await suggestPlaces(q, session.current)
        } else {
          found = (await searchRestaurants(q)).map((r) => ({ key: r.id, name: r.name, address: r.address, row: r }))
        }
        if (live) {
          setOptions(found)
          setState('idle')
        }
      } catch (e) {
        if (live) {
          setError(e)
          setState('error')
        }
      }
    }, 300)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [text, typed])

  const pick = async (option) => {
    setState('picking')
    setError(null)
    try {
      const restaurant = option.row ?? (await upsertRestaurant(await placeDetails(option.prediction)))
      session.current = null
      setTyped(false)
      setText(restaurant.name)
      setOptions([option])
      onChange(restaurant)
      setState('idle')
    } catch (e) {
      setError(e)
      setState('error')
    }
  }

  // Our addresses read "University Center · 4257 Campus Dr": the branch goes in the title, the street below.
  const branch = (address) => (address?.includes(' · ') ? address.split(' · ')[0] : null)
  const street = (address) => (address?.includes(' · ') ? address.split(' · ').slice(1).join(' · ') : address)

  return (
    <div className="restaurant-picker">
      <div className={invalid ? 'search search--invalid' : 'search'}>
        <Icon name="search" size={18} />
        <input
          id="post-restaurant"
          value={text}
          placeholder="Search for a restaurant…"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            setTyped(true)
            setText(e.target.value)
            if (value) onChange(null)
          }}
        />
      </div>

      {(options.length > 0 || value) && (
        <div className="place-options" role="listbox" aria-label="Restaurants">
          {value && !options.some((o) => (o.row?.id ?? o.key) === value.id) && (
            <div className="place-option is-selected" role="option" aria-selected="true">
              <Icon name="pin" />
              <span>
                <strong>{[value.name, branch(value.address)].filter(Boolean).join(' · ')}</strong>
                <small>{street(value.address)}</small>
              </span>
            </div>
          )}
          {options.map((o) => {
            const selected = value && (o.row?.id ?? o.key) === value.id
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={!!selected}
                className={selected ? 'place-option is-selected' : 'place-option'}
                onClick={() => pick(o)}
                disabled={state === 'picking'}
              >
                <Icon name="pin" />
                <span>
                  <strong>{o.row ? [o.name, branch(o.address)].filter(Boolean).join(' · ') : o.name}</strong>
                  <small>{o.row ? street(o.address) : o.address}</small>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <p className="field-hint">
        {state === 'searching' && 'Searching…'}
        {state === 'picking' && 'Saving the restaurant…'}
        {state === 'error' && (error?.message ?? 'Something went wrong. Try again.')}
        {state === 'idle' &&
          (typed && text.trim().length >= 2 && !options.length
            ? 'No restaurant found. Try another name.'
            : 'Choose the restaurant and branch for this dish.')}
      </p>
    </div>
  )
}
