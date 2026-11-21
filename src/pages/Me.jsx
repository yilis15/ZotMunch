// Me (Figma 18): your food journal — profile, latest post, drafts, reviews, preferences.
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { useDrafts, useMyPosts } from '../lib/queries'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import { DishPhoto, ErrorNote } from '../components/ui'
import { supabase } from '../lib/supabase'

export default function Me() {
  const { profile, email, startTour } = useApp()
  const { data: posts = null, error: postsError } = useMyPosts()
  const { data: drafts = null, error: draftsError } = useDrafts()
  const error = postsError ?? draftsError

  const first = profile?.display_name?.split(' ')[0]
  const latest = posts?.[0]

  return (
    <div className="page page--narrow">
      <section className="journal-card">
        <div className="journal-card__text">
          <p className="eyebrow eyebrow--gold">Your food journal</p>
          <h1 className="title title--light">Hey{first ? `, ${first}` : ''}!</h1>
          <p className="small journal-card__email">{email}</p>
          <Link to="/me/profile" className="journal-card__link">
            Edit profile
          </Link>
        </div>
        {/* The avatar opens Edit profile with the avatar choices already showing. */}
        <Link to="/me/profile" state={{ pickAvatar: true }} className="journal-card__avatar" aria-label="Change avatar">
          <Avatar url={profile?.avatar_url} size={96} className="avatar--frame" />
        </Link>
      </section>

      <ErrorNote error={error} />

      <section className="stack">
        <div className="section-head">
          <h2 className="title title--sm">Made by you</h2>
          {posts?.length > 0 && (
            <Link to="/me/posts" className="link-btn">
              Manage posts{posts.length > 1 ? ` (${posts.length})` : ''}
            </Link>
          )}
        </div>
        {posts === null ? (
          <div className="post-row post-row--loading" aria-hidden="true" />
        ) : latest ? (
          <div className="post-row">
            <Link to={`/dish/${latest.id}`} className="post-row__photo">
              <DishPhoto dish={latest} />
            </Link>
            <div className="post-row__info">
              <Link to={`/dish/${latest.id}`}>
                <h3 className="title title--xs">{latest.name}</h3>
              </Link>
              <p className="meta">
                {[latest.restaurant.name, latest.restaurant.address?.split(' · ')[0]].filter(Boolean).join(' · ')}
              </p>
              <Link to={`/me/posts/${latest.id}/edit`} className="link-btn link-btn--inline">
                Edit post
              </Link>
            </div>
          </div>
        ) : (
          <div className="post-row post-row--empty">
            <p className="muted">You haven't shared a bite yet.</p>
            <Link to="/post" className="btn btn--gold btn--sm">
              Share your first bite
            </Link>
          </div>
        )}
      </section>

      <Link to="/me/drafts" className="menu-card card menu-row">
        <Icon name="edit" />
        <span className="menu-row__text">
          Draft{drafts?.length > 1 ? 's' : ''}
          <small>
            {drafts === null
              ? ' '
              : drafts.length
                ? `Continue your unpublished post${drafts.length > 1 ? `s (${drafts.length})` : ''}`
                : 'No drafts right now'}
          </small>
        </span>
        <Icon name="chevron" className="push-right" />
      </Link>

      <nav className="menu-card card" aria-label="Me">
        <Link to="/me/reviews" className="menu-row">
          <Icon name="star" /> My reviews <Icon name="chevron" className="push-right" />
        </Link>
        <Link to="/me/preferences" className="menu-row">
          <Icon name="filter" /> Food preferences <Icon name="chevron" className="push-right" />
        </Link>
        <button type="button" className="menu-row menu-row--button" onClick={startTour}>
          <Icon name="discover" /> How ZotMunch works <Icon name="chevron" className="push-right" />
        </button>
      </nav>

      <button type="button" className="btn btn--outline btn--block" onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    </div>
  )
}
