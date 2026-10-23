import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { createReview, getDish } from '../lib/api'
import Icon, { Chili } from '../components/Icon'
import { BackBar, ErrorNote, Loader } from '../components/ui'

export default function WriteReview() {
  const { id } = useParams()
  const { userId } = useApp()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [dish, setDish] = useState(null)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photosRef = useRef(photos)

  useEffect(() => {
    let live = true
    getDish(id)
      .then((result) => live && setDish(result))
      .catch((reason) => live && setError(reason))
    return () => {
      live = false
    }
  }, [id])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)), [])

  const addPhotos = (event) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    setPhotos((current) => [
      ...current,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
    event.target.value = ''
  }

  const removePhoto = (index) => {
    const photo = photos[index]
    if (photo) URL.revokeObjectURL(photo.preview)
    setPhotos((current) => current.filter((_, i) => i !== index))
  }

  const postReview = async (event) => {
    event.preventDefault()
    if (!rating || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await createReview(userId, id, rating, body, photos.map(({ file }) => file))
      navigate(`/dish/${id}`, {
        replace: true,
        state: { reviewPosted: true, photoError: result.photoError },
      })
    } catch (reason) {
      setError(reason)
      setSubmitting(false)
    }
  }

  if (error && !dish) {
    return (
      <div className="page review-page">
        <BackBar title="Write a review" to={`/dish/${id}`} />
        <ErrorNote error={error} />
      </div>
    )
  }
  if (!dish) return <Loader label="Getting this bite ready…" />

  return (
    <div className="page review-page">
      <BackBar title="Write a review" to={`/dish/${id}`} />

      <header className="review-hero">
        <div>
          <p className="eyebrow">Your honest take</p>
          <h2 className="title">Tell us about<br />this bite.</h2>
        </div>
        <img src="/mascots/orange-hug.png" alt="" />
      </header>

      <section className="review-dish" aria-label="Dish you're reviewing">
        {dish.photo ? (
          <img className="review-dish__photo" src={dish.photo} alt="" />
        ) : (
          <div className="review-dish__photo review-dish__photo--empty">
            <Icon name="discover" size={32} />
          </div>
        )}
        <div className="review-dish__details">
          <h3>{dish.name}</h3>
          <p>{[dish.restaurant.name, dish.restaurant.address?.split(' · ')[0]].filter(Boolean).join(' · ')}</p>
          <div className="review-dish__meta">
            <span className="review-spice" aria-label={`Spice level ${dish.spiceLevel} of 3`}>
              {dish.spiceLevel > 0 && <Chili size={20} />}
            </span>
            <Link to={`/dish/${id}#dish-tags`} className="review-edit-tags">Edit tags</Link>
          </div>
        </div>
      </section>

      <form className="review-form" onSubmit={postReview}>
        <fieldset className="review-rating">
          <legend>How was it?</legend>
          <div className="review-stars" role="radiogroup" aria-label="Rating">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  className={value <= rating ? 'is-selected' : ''}
                  onClick={() => setRating(value)}
                >
                  <Icon name="star" size={46} />
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="review-body">
          <span>What should other Anteaters know about this dish?</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="The good, the not-so-good, and your tips."
            rows={5}
          />
        </label>

        <div className="review-photos">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={addPhotos}
            aria-label="Choose review photos"
          />
          {photos.length ? (
            <div className="review-photo-list">
              {photos.map((photo, index) => (
                <div className="review-photo" key={photo.preview}>
                  <img src={photo.preview} alt={`Review upload ${index + 1}`} />
                  <button
                    type="button"
                    className="review-photo__remove"
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => removePhoto(index)}
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              ))}
              <button type="button" className="review-add-more" onClick={() => fileInput.current?.click()}>
                <Icon name="post" />
                Add photos
              </button>
            </div>
          ) : (
            <button type="button" className="review-add-photos" onClick={() => fileInput.current?.click()}>
              <Icon name="photo" size={30} />
              <span>Add photos</span>
            </button>
          )}
        </div>

        <ErrorNote error={error} />
        <button type="submit" className="btn btn--blue btn--block review-submit" disabled={!rating || submitting}>
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </form>

      <p className="review-footer">Good or bad, your experience helps.</p>
    </div>
  )
}
