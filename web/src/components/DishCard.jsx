// Feed card and the meta lines shared with the Swipe card.
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { formatMiles } from '../lib/location'
import { priceLabel } from '../lib/discover'
import { Chip, DishPhoto, SpiceLevel } from './ui'

const CARD_TAG_CATEGORIES = ['cuisine', 'food_type']

export function DishMeta({ dish }) {
  const where = [dish.restaurant.name, dish.restaurant.address?.split(' · ')[0], formatMiles(dish.distance)]
  return (
    <>
      <p className="meta">{[...new Set(where.filter(Boolean))].join(' · ')}</p>
      {dish.saveCount > 0 && (
        <p className="meta loved">
          <span aria-hidden="true">❤️</span> Loved by {dish.saveCount} Anteater{dish.saveCount === 1 ? '' : 's'}
        </p>
      )}
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
      {dish.spiceLevel > 0 && (
        <span className="chip chip--icon">
          <SpiceLevel level={dish.spiceLevel} />
        </span>
      )}
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

// `from` ('feed') tells the detail page to log a view swipe for this mode.
export default function DishCard({ dish, from }) {
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
