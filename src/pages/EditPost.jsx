// Edit an existing post (Figma 20): the Share-a-bite form, filled in, saving with Save changes.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { loadDish, loadMyReview } from '../lib/queries'
import PostForm from '../components/PostForm'
import { BackBar, ErrorNote, Loader } from '../components/ui'

export default function EditPost() {
  const { id } = useParams()
  const { userId } = useApp()
  const [initial, setInitial] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([loadDish(id), loadMyReview(userId, id)])
      .then(([dish, review]) => {
        if (!live) return
        if (dish.createdBy !== userId) {
          setError(new Error('Only the Anteater who posted this dish can edit it.'))
          return
        }
        setInitial({
          dishId: dish.id,
          // Only your own photos can be removed here; other people's stay with their reviews.
          photos: dish.photos
            .filter((p) => !p.reviewId || p.reviewId === review?.id)
            .map((p) => ({ key: p.id, id: p.id, path: p.path, url: p.url, small: p.small })),
          name: dish.name,
          restaurant: dish.restaurant,
          price: dish.price == null ? '' : String(dish.price),
          rating: review?.rating ?? null,
          body: review?.body ?? '',
          tagIds: dish.tagIds,
        })
      })
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [id, userId])

  if (error) {
    return (
      <div className="page page--narrow">
        <BackBar title="Edit post" />
        <ErrorNote error={error} />
      </div>
    )
  }
  if (!initial) return <Loader label="Opening your post…" />

  return (
    <div className="page page--narrow">
      <BackBar title="Edit post" />
      <PostForm mode="edit" initial={initial} />
    </div>
  )
}
