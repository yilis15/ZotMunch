// Other popular dishes (Figma 09): everything shared from one restaurant, most loved first.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRestaurant } from '../lib/api'
import { PricePill } from '../components/DishCard'
import { BackBar, DishPhoto, ErrorNote, Loader } from '../components/ui'

export default function Restaurant() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    getRestaurant(id)
      .then((r) => live && setRestaurant(r))
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [id])

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
