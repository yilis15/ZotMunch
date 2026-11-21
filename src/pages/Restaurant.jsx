// Other popular dishes (Figma 09): everything shared from one restaurant, most loved first.
import { Link, useParams } from 'react-router-dom'
import { useRestaurant } from '../lib/queries'
import { PricePill } from '../components/DishCard'
import { BackBar, DishPhoto, ErrorNote, Loader } from '../components/ui'

export default function Restaurant() {
  const { id } = useParams()
  const { data: restaurant, error } = useRestaurant(id)

  if (error) return <div className="page"><BackBar title="Other popular dishes" /><ErrorNote error={error} /></div>
  if (!restaurant) return <Loader />

  return (
    <div className="page">
      <BackBar title="Other popular dishes" />
      <h2 className="title">{restaurant.name}</h2>
      <p className="meta">{restaurant.address}</p>
      <div className="feed-grid">
        {restaurant.dishes.map((d) => (
          <Link key={d.id} to={`/dish/${d.id}`} className="card mini-dish">
            <DishPhoto dish={d} className="mini-dish__photo" />
            <div className="mini-dish__row">
              <h3 className="dish-name">{d.name}</h3>
              <PricePill price={d.price} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
