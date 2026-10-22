// Saved (Figma 16, 17, 22): wanted dishes grouped by restaurant, each toggling Not yet ⇄ Tried it.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import { getSaves, setSaveStatus } from '../lib/api'
import { formatMiles } from '../lib/location'
import { priceLabel } from '../lib/discover'
import { DishPhoto, EmptyState, ErrorNote, Hero, Loader, Segmented } from '../components/ui'

const TABS = [['all', 'All'], ['not_yet', 'Not yet'], ['tried', 'Tried it']]

function groupByRestaurant(saves) {
  const groups = new Map()
  for (const s of saves) {
    const r = s.dish.restaurant
    if (!groups.has(r.id)) groups.set(r.id, { restaurant: r, saves: [] })
    groups.get(r.id).saves.push(s)
  }
  return [...groups.values()]
}

export default function Saved() {
  const { userId } = useApp()
  const navigate = useNavigate()
  const [saves, setSaves] = useState(null)
  const [tab, setTab] = useState('all')
  const [justTried, setJustTried] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    getSaves(userId)
      .then((s) => live && setSaves(s))
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [userId])

  const toggle = async (save) => {
    const next = save.status === 'tried' ? 'not_yet' : 'tried'
    const update = (status) =>
      setSaves((all) => all.map((s) => (s.dish.id === save.dish.id ? { ...s, status } : s)))
    update(next)
    setJustTried(next === 'tried')
    try {
      await setSaveStatus(userId, save.dish.id, next)
    } catch (e) {
      update(save.status)
      setError(e)
    }
  }

  if (!saves) {
    return error ? <div className="page"><ErrorNote error={error} /></div> : <Loader label="Opening your food list…" />
  }

  if (!saves.length) {
    return (
      <div className="page">
        <Hero eyebrow="Saved / Your food journal" title={<>Your next<br />craving lives here.</>} />
        <EmptyState
          mascot="sleep"
          framed
          title="Nothing saved… yet!"
          actions={
            <button type="button" className="btn btn--gold btn--block" onClick={() => navigate('/')}>
              Discover dishes
            </button>
          }
        >
          Tap Want it on a dish to start your delicious little to-do list.
        </EmptyState>
      </div>
    )
  }

  const shown = (saves ?? []).filter((s) => tab === 'all' || s.status === tab)
  const toTry = (saves ?? []).filter((s) => s.status === 'not_yet').length

  return (
    <div className="page">
      {tab === 'tried' ? (
        <Hero eyebrow="Saved / Good memories" title={<>Been there.<br />Munched that.</>} mascot="cookie" />
      ) : (
        <Hero eyebrow="Saved / Your next stops" title={<>A little list.<br />A lot to munch.</>} mascot="mug" />
      )}
      <Segmented label="Saved filter" options={TABS} value={tab} onChange={setTab} />
      <p className="muted small">
        {saves.length} dish{saves.length === 1 ? '' : 'es'} saved · {toTry} still to try
      </p>
      <ErrorNote error={error} />

      {justTried && (
        <div className="banner" role="status">
          <strong>One more happy bite, checked off.</strong>
          <span>You can change this any time.</span>
        </div>
      )}

      <div className="saved-grid">
        {groupByRestaurant(shown).map(({ restaurant, saves: items }) => (
          <section key={restaurant.id} className="card saved-group">
            <Link to={`/restaurant/${restaurant.id}`} className="saved-group__head">
              <h2 className="title title--xs">{restaurant.name}</h2>
              <p className="meta">{restaurant.address?.split(' · ')[0]}</p>
            </Link>
            {items.map((s) => (
              <div key={s.dish.id} className="saved-row">
                <Link to={`/dish/${s.dish.id}`} className="saved-row__dish">
                  <DishPhoto dish={s.dish} className="saved-row__photo" />
                  <div>
                    <h3 className="dish-name dish-name--sm">{s.dish.name}</h3>
                    <p className="meta">
                      {[priceLabel(s.dish.price), formatMiles(s.dish.distance)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  className={s.status === 'tried' ? 'btn btn--blue btn--sm' : 'btn btn--outline btn--sm'}
                  aria-pressed={s.status === 'tried'}
                  onClick={() => toggle(s)}
                >
                  {s.status === 'tried' ? 'Tried it ✓' : 'Not yet'}
                </button>
              </div>
            ))}
          </section>
        ))}
      </div>
      {!shown.length && (
        <p className="muted center">{tab === 'tried' ? 'Nothing checked off yet.' : 'Everything here is tried. Nice!'}</p>
      )}
      {tab === 'tried' && (
        <button type="button" className="btn btn--gold btn--block" onClick={() => navigate('/')}>
          Find your next spot
        </button>
      )}
    </div>
  )
}
