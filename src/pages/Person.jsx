// A poster's page (/people/:id), opened from the poster line on a Feed card: who they are and every
// dish they posted, newest first, in the same cards as Feed (Want it → pick lists). Opened for yourself,
// it says "Your posts" and links to My posts for editing.
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../lib/app'
import { usePerson, useSavedIn } from '../lib/queries'
import Avatar from '../components/Avatar'
import { FeedCard } from '../components/DishCard'
import { BackBar, EmptyState, ErrorNote, Loader } from '../components/ui'

export default function Person() {
  const { id } = useParams()
  const { userId } = useApp()
  const { data, error } = usePerson(id)
  const dishes = useMemo(() => data?.dishes ?? [], [data])
  const ids = useMemo(() => dishes.map((d) => d.id), [dishes])
  const savedIn = useSavedIn(ids).data
  const me = id === userId

  if (error) {
    return (
      <div className="page">
        <BackBar title="Posts" />
        <ErrorNote error={error} />
      </div>
    )
  }
  if (!data) return <Loader />

  if (!data.person) {
    return (
      <div className="page">
        <BackBar title="Posts" />
        <EmptyState mascot="sleep" title="This person isn’t on ZotMunch anymore.">
          Their dishes may still show in Feed as posted by an Anteater.
        </EmptyState>
      </div>
    )
  }

  const { person } = data
  return (
    <div className="page">
      <BackBar title={me ? 'Your posts' : 'Posts'} />
      <header className="person-head">
        <Avatar url={person.avatar} size={64} />
        <div className="person-head__text">
          <h2 className="title title--sm">{me ? 'Your posts' : person.name}</h2>
          <span className="muted small">
            {dishes.length} dish{dishes.length === 1 ? '' : 'es'} posted
            {me && (
              <>
                {' · '}
                <Link to="/me/posts">Edit in My posts</Link>
              </>
            )}
          </span>
        </div>
      </header>
      {dishes.length ? (
        <div className="feed-grid">
          {dishes.map((d) => (
            <FeedCard key={d.id} dish={d} hidePoster logAs={null} listIds={savedIn?.get(d.id) ?? (savedIn ? [] : undefined)} />
          ))}
        </div>
      ) : (
        <EmptyState mascot="mug" title="No dishes posted yet.">
          {me ? 'Share a dish you love and it shows up here.' : 'Check back later for their picks.'}
        </EmptyState>
      )}
    </div>
  )
}
