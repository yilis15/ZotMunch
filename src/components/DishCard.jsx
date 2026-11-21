// Feed card and the meta lines shared with the Swipe card.
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { formatMiles } from '../lib/location'
import { priceLabel } from '../lib/discover'
import { postedDate } from '../lib/format'
import Avatar from './Avatar'
import FeedSaveButton from './FeedSaveButton'
import { Chip, DishPhoto } from './ui'

const CARD_TAG_CATEGORIES = ['cuisine', 'food_type']

export function DishMeta({ dish }) {
  const where = [dish.restaurant.name, dish.restaurant.address?.split(' · ')[0], formatMiles(dish.distance)]
  return (
    <>
      <p className="meta">{[...new Set(where.filter(Boolean))].join(' · ')}</p>
      {/* Always there, empty at 0 saves, so every card keeps the same lines (app.css). */}
      <p className="meta loved" aria-hidden={dish.saveCount > 0 ? undefined : true}>
        {dish.saveCount > 0 && (
          <>
            <span aria-hidden="true">❤️</span> Saved by {dish.saveCount} Anteater{dish.saveCount === 1 ? '' : 's'}
          </>
        )}
      </p>
    </>
  )
}

export function DishChips({ dish }) {
  const { tagsById } = useApp()
  const tags = dish.tagIds
    .map((id) => tagsById.get(id))
    .filter((t) => t && CARD_TAG_CATEGORIES.includes(t.category) && t.name !== 'Other')
    .slice(0, 2)
  return (
    <div className="chips">
      {tags.map((t) => (
        <Chip key={t.id}>{t.name}</Chip>
      ))}
    </div>
  )
}

export function PricePill({ price, size }) {
  const label = priceLabel(price)
  return label ? <span className={`price ${size === 'lg' ? 'price--lg' : ''}`}>{label}</span> : null
}

// The poster line: its own link to their page (/people/:id); not a link when the account is gone.
function PosterLine({ dish }) {
  const inner = (
    <>
      <Avatar url={dish.poster?.avatar} size={28} />
      <span className="dish-card__poster-name">{dish.poster?.name ?? 'An Anteater'}</span>
      {dish.createdAt && <span className="dish-card__poster-date">· {postedDate(dish.createdAt)}</span>}
    </>
  )
  return dish.createdBy && dish.poster ? (
    <Link to={`/people/${dish.createdBy}`} className="dish-card__poster dish-card__poster--link">
      {inner}
    </Link>
  ) : (
    <div className="dish-card__poster">{inner}</div>
  )
}

// Feed's card reads like a post: who posted it on top (a link to their page), the dish (one link), and
// Want it at the bottom, outside both links so the button opens only the list sheet. `listIds` are my
// lists that already hold the dish. The poster's own page (Person) hides the poster line; there a
// Want it isn't a Feed swipe, so `logAs` is left out.
export function FeedCard({ dish, listIds, hidePoster, logAs = 'feed' }) {
  return (
    <article className="card dish-card dish-card--post">
      {!hidePoster && <PosterLine dish={dish} />}
      <Link to={`/dish/${dish.id}`} state={logAs ? { from: logAs } : undefined} className="dish-card__link">
        <DishPhoto dish={dish} className="dish-card__photo" />
        <div className="dish-card__body">
          <h3 className="dish-name" title={dish.name}>
            {dish.name}
          </h3>
          <DishMeta dish={dish} />
          {hidePoster && dish.createdAt && <p className="dish-card__posted">Posted {postedDate(dish.createdAt)}</p>}
          <div className="dish-card__foot">
            <DishChips dish={dish} />
            <PricePill price={dish.price} size="lg" />
          </div>
        </div>
      </Link>
      <div className="dish-card__actions">
        <FeedSaveButton dish={dish} listIds={listIds} logAs={logAs} />
      </div>
    </article>
  )
}

// `from` ('feed') tells the detail page to log a view swipe for this mode.
export default function DishCard({ dish, from, listIds }) {
  if (from === 'feed') return <FeedCard dish={dish} listIds={listIds} />
  return (
    <Link to={`/dish/${dish.id}`} state={from && { from }} className="card dish-card">
      <DishPhoto dish={dish} className="dish-card__photo" />
      <div className="dish-card__body">
        <h3 className="dish-name">{dish.name}</h3>
        <DishMeta dish={dish} />
        <div className="dish-card__foot">
          <DishChips dish={dish} />
          <PricePill price={dish.price} size="lg" />
        </div>
      </div>
    </Link>
  )
}
