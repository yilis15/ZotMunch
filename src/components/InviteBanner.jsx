// Invitations waiting for an answer, at the top of Saved (spec 3.4 A). One invitation shows its own
// Decline / Accept (each half the width); several fold into "You have n invitations · Review".
import { useState } from 'react'
import { answerInvite } from '../lib/api'
import { memberWord } from '../lib/lists'
import { refreshAfter } from '../lib/queries'
import Avatar from './Avatar'
import { ErrorNote } from './ui'

export function InviteCard({ invite, onAnswered }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const answer = async (accept) => {
    setBusy(true)
    setError(null)
    try {
      await answerInvite(invite.listId, accept)
      await refreshAfter('members') // the joined list is in My lists before it opens
      onAnswered(invite, accept)
    } catch (e) {
      setError(e)
      refreshAfter('members')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="invite-card" role="group" aria-label={`Invitation to ${invite.name}`}>
      <div className="invite-card__head">
        <Avatar url={invite.inviter?.avatar} size={40} />
        <p>
          <strong>{invite.inviter?.name?.split(' ')[0] ?? 'Someone'}</strong> invited you to{' '}
          <strong>{invite.name}</strong>
          <span className="muted small"> · {memberWord(invite.memberCount)}</span>
        </p>
      </div>
      <div className="invite-card__actions">
        <button type="button" className="btn btn--outline" disabled={busy} onClick={() => answer(false)}>
          Decline
        </button>
        <button type="button" className="btn btn--gold" disabled={busy} onClick={() => answer(true)}>
          Accept
        </button>
      </div>
      <ErrorNote error={error} />
    </div>
  )
}

export default function InviteBanner({ invites, onAnswered, onReview }) {
  if (!invites?.length) return null
  if (invites.length === 1) return <InviteCard invite={invites[0]} onAnswered={onAnswered} />
  return (
    <button type="button" className="invite-card invite-card--many" onClick={onReview}>
      <span>
        <strong>You have {invites.length} invitations</strong>
        <span className="muted small"> · Review</span>
      </span>
    </button>
  )
}
