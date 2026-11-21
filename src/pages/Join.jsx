// /join/:token — an invite link (spec 3.4 B and C). Signed out, App keeps the token through sign-in and
// onboarding and comes back here. Shows the list before joining; Accept joins as an Editor and opens
// the list in Saved, Decline goes back to ZotMunch. Every state the link can be in has its own card.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { joinByLink, previewInvite } from '../lib/api'
import { memberWord, setPendingJoin } from '../lib/lists'
import { refreshAfter } from '../lib/queries'
import Avatar from '../components/Avatar'
import { ErrorNote, Loader } from '../components/ui'

function Card({ mascot = 'cookie', title, children, actions }) {
  return (
    <div className="page page--narrow join">
      <div className="join__card">
        <img className="join__mascot" src={`/mascots/${mascot}.png`} alt="" />
        <h1 className="title">{title}</h1>
        {children}
        <div className="join__actions">{actions}</div>
      </div>
    </div>
  )
}

export default function Join() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [declined, setDeclined] = useState(false)
  const preview = useQuery({ queryKey: ['invitePreview', token], queryFn: () => previewInvite(token), staleTime: 0 })

  // Whatever happens here, the link has been opened: signing in again shouldn't bring it back.
  useEffect(() => setPendingJoin(null), [])

  const openList = (listId) => navigate(listId ? `/saved?list=${listId}` : '/saved', { replace: true })
  const home = (
    <button type="button" className="btn btn--outline btn--block" onClick={() => navigate('/', { replace: true })}>
      Back to ZotMunch
    </button>
  )

  if (preview.isPending) return <Loader label="Opening your invitation…" />
  if (preview.error) {
    return (
      <Card mascot="sleep" title="Something went wrong." actions={<button type="button" className="btn btn--blue btn--block" onClick={() => preview.refetch()}>Try again</button>}>
        <p className="muted">Please try again.</p>
      </Card>
    )
  }

  const p = preview.data
  if (declined) {
    return (
      <Card mascot="sleep" title="Invitation declined." actions={home}>
        <p className="muted">You can keep exploring delicious finds on ZotMunch.</p>
      </Card>
    )
  }
  if (p.status === 'unavailable') {
    return (
      <Card mascot="sleep" title="This invitation is no longer available." actions={home}>
        <p className="muted">The link was reset, expired, or the list was deleted. Ask the list owner for a new link.</p>
      </Card>
    )
  }
  if (p.status === 'already_member' || p.status === 'owner') {
    return (
      <Card
        title={p.status === 'owner' ? 'This is your list.' : 'You’re already a member.'}
        actions={
          <button type="button" className="btn btn--gold btn--block" onClick={() => openList(p.listId)}>
            Open list
          </button>
        }
      >
        <p className="muted">
          {p.status === 'owner' ? 'Share the link with friends to invite them.' : 'Your next food adventure is waiting.'}
        </p>
      </Card>
    )
  }

  const accept = async () => {
    setBusy(true)
    setError(null)
    try {
      const listId = await joinByLink(token)
      await refreshAfter('members')
      navigate(`/saved?list=${listId}`, { replace: true, state: { joined: { listId, name: p.name } } })
    } catch (e) {
      setError(e)
      setBusy(false)
      preview.refetch()
    }
  }

  return (
    <Card
      title="A table for more!"
      actions={
        <>
          <button type="button" className="btn btn--outline" disabled={busy} onClick={() => setDeclined(true)}>
            Decline
          </button>
          <button type="button" className="btn btn--gold" disabled={busy} onClick={accept}>
            {busy ? 'Joining…' : 'Accept'}
          </button>
        </>
      }
    >
      <p className="join__name">{p.name}</p>
      <p className="join__by">
        <Avatar url={p.owner?.avatar} size={28} /> Invited by {p.owner?.name ?? 'the owner'}
      </p>
      <p className="muted small">
        {memberWord(p.memberCount)} · Joining as Editor
      </p>
      <p className="muted small">Dishes stay private until you accept.</p>
      <ErrorNote error={error} />
    </Card>
  )
}
