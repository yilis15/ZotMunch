// Post and Me are next round; for now they say so, and Me offers preferences and sign out.
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'
import { EmptyState } from '../components/ui'

export function Post() {
  return (
    <div className="page">
      <EmptyState mascot="cookie" title="Sharing bites is coming soon.">
        Next round you'll be able to post a dish, add photos, and write a review.
      </EmptyState>
    </div>
  )
}

export function Me() {
  const { profile, email } = useApp()
  const first = profile?.display_name?.split(' ')[0]
  return (
    <div className="page page--narrow">
      <section className="journal-card">
        <div>
          <p className="eyebrow eyebrow--gold">Your food journal</p>
          <h1 className="title title--light">Hey{first ? `, ${first}` : ''}!</h1>
          <p className="small">
            {profile?.uci_verified ? 'UCI Anteater' : 'Anteater friend'} · {email}
          </p>
        </div>
        <img src="/mascots/mug.png" alt="" />
      </section>

      <nav className="menu-card card" aria-label="Me">
        <Link to="/onboarding" className="menu-row">
          <Icon name="filter" /> Food preferences <Icon name="chevron" className="push-right" />
        </Link>
        <Link to="/saved" className="menu-row">
          <Icon name="check" /> My food list <Icon name="chevron" className="push-right" />
        </Link>
      </nav>
      <p className="muted small center">Your posts, stats, and places you've tried are coming soon.</p>

      <button type="button" className="btn btn--outline btn--block" onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    </div>
  )
}
