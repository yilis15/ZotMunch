// Invite people to a list (spec 3.3), like sharing a Google file: add people by name or email, see who
// has access and who is still invited, and copy or reset the invite link. Rename / delete / leave live
// in ListSettings (the ⚙ next to Invite).
import { useEffect, useState } from 'react'
import { cancelInvite, findPeople, getInviteLink, invitePeople, removeMember, resetInviteLink } from '../lib/api'
import { listName } from '../lib/lists'
import { refreshAfter, useListMembers } from '../lib/queries'
import Avatar from './Avatar'
import ConfirmDialog from './ConfirmDialog'
import Icon from './Icon'
import Sheet from './Sheet'
import { ErrorNote } from './ui'

const SEARCH_DELAY_MS = 250
const looksLikeEmail = (q) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.trim())

function AddPeople({ list, onError }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null until a search has run
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      return undefined
    }
    let live = true
    const timer = setTimeout(() => {
      findPeople(list.id, q)
        .then((r) => live && setResults(r))
        .catch((e) => live && onError(e))
    }, SEARCH_DELAY_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [query, list.id, onError])

  const pick = (p) => {
    setPicked((all) => (all.some((x) => x.id === p.id) ? all : [...all, p]))
    setQuery('')
    setResults(null)
    setSent(null)
  }

  const invite = async (e) => {
    e.preventDefault()
    if (!picked.length) return
    setBusy(true)
    try {
      const invited = await invitePeople(list.id, picked.map((p) => p.id))
      setSent(invited.length ? 'Invitations sent. Waiting for them to accept.' : 'They already have access or an invitation.')
      setPicked([])
      refreshAfter('members')
    } catch (err) {
      onError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="share__add" onSubmit={invite}>
      <label className="field-label" htmlFor="share-search">
        Add people
      </label>
      {picked.length > 0 && (
        <div className="chips">
          {picked.map((p) => (
            <span key={p.id} className="chip chip--selected share__chip">
              {p.name}
              <button
                type="button"
                className="share__chip-x"
                aria-label={`Don’t invite ${p.name}`}
                onClick={() => setPicked((all) => all.filter((x) => x.id !== p.id))}
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="share__search-row">
        <input
          id="share-search"
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or email"
          autoComplete="off"
        />
        <button type="submit" className="btn btn--blue" disabled={!picked.length || busy}>
          {busy ? 'Inviting…' : 'Invite'}
        </button>
      </div>
      {results && (
        <ul className="share__results" aria-label="People found">
          {results.map((p) => {
            const taken = p.relation === 'active' ? 'Member' : p.relation === 'invited' ? 'Invited' : null
            return (
              <li key={p.id}>
                <button type="button" className="person-row person-row--pick" disabled={Boolean(taken)} onClick={() => pick(p)}>
                  <Avatar url={p.avatar} size={36} />
                  <span className="person-row__text">
                    <strong>{p.name}</strong>
                    <small>{p.email}</small>
                  </span>
                  {taken && <span className="muted small">{taken}</span>}
                </button>
              </li>
            )
          })}
          {!results.length && (
            <li className="muted small share__none">
              {looksLikeEmail(query)
                ? 'No ZotMunch account uses this email. Copy the invite link below and send it to them instead.'
                : 'No one found. Try a name or a full email.'}
            </li>
          )}
        </ul>
      )}
      {sent && (
        <p className="muted small" role="status">
          {sent}
        </p>
      )}
    </form>
  )
}

function InviteLink({ list, isOwner, onError }) {
  const [url, setUrl] = useState(null)
  const [copied, setCopied] = useState(null) // 'copied' | 'manual'
  const [busy, setBusy] = useState(false)
  const [resetting, setResetting] = useState(false)

  const copy = async (fetchUrl = getInviteLink) => {
    setBusy(true)
    try {
      const link = await fetchUrl(list.id)
      setUrl(link)
      try {
        await navigator.clipboard.writeText(link)
        setCopied('copied')
      } catch {
        setCopied('manual') // no clipboard access: show the link to copy by hand
      }
    } catch (e) {
      onError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="share__section">
      <h3 className="share__label">Invite with a link</h3>
      <p className="muted small">People sign in and accept before joining as an Editor.</p>
      <div className="share__link-row">
        <button type="button" className="btn btn--outline btn--grow" disabled={busy} onClick={() => copy()}>
          🔗 Copy invite link
        </button>
        {isOwner && (
          <button type="button" className="btn btn--soft" disabled={busy} onClick={() => setResetting(true)}>
            Reset
          </button>
        )}
      </div>
      <p className="muted small" aria-live="polite">
        {copied === 'copied' ? 'Link copied!' : ''}
      </p>
      {copied === 'manual' && url && (
        <label className="field">
          <span className="field-label">Copy this invitation link</span>
          <input className="input" readOnly value={url} onFocus={(e) => e.target.select()} autoFocus />
        </label>
      )}
      {resetting && (
        <ConfirmDialog
          title="Reset the invite link?"
          body="Old links will stop working. People already in the list stay."
          confirmLabel="Reset link"
          busyLabel="Resetting…"
          busy={busy}
          onCancel={() => setResetting(false)}
          onConfirm={async () => {
            await copy(resetInviteLink)
            setResetting(false)
          }}
        />
      )}
    </section>
  )
}

export default function ShareDialog({ list, userId, onClose }) {
  const { data, error: loadError } = useListMembers(list.id)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'remove', person }
  const [busy, setBusy] = useState(false)
  const isOwner = list.ownerId === userId
  const name = listName(list)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      refreshAfter('members')
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const members = data?.members ?? []
  const pending = data?.pending ?? []

  return (
    <Sheet title={`Invite to “${name}”`} subtitle="Invite friends to plan your next food adventure." onClose={onClose} wide>
      <AddPeople list={list} onError={setError} />
      <ErrorNote error={error ?? loadError} />

      <section className="share__section">
        <h3 className="share__label">
          People with access <span className="muted">({members.length})</span>
        </h3>
        <ul className="people-list">
          {members.map((m) => (
            <li key={m.id} className="person-row">
              <Avatar url={m.avatar} size={40} />
              <span className="person-row__text">
                <strong>
                  {m.name}
                  {m.id === userId && <span className="muted small"> (you)</span>}
                </strong>
                <small>{m.role === 'owner' ? 'Owner' : 'Editor'}</small>
              </span>
              {isOwner && m.role !== 'owner' && (
                <button
                  type="button"
                  className="btn btn--sm btn--outline person-row__action"
                  onClick={() => setConfirm({ kind: 'remove', person: m })}
                  aria-label={`Remove ${m.name} from the list`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {pending.length > 0 && (
        <section className="share__section">
          <h3 className="share__label">
            Pending invitations <span className="muted">({pending.length})</span>
          </h3>
          <ul className="people-list">
            {pending.map((p) => (
              <li key={p.id} className="person-row">
                <Avatar url={p.avatar} size={40} />
                <span className="person-row__text">
                  <strong>{p.name}</strong>
                  <small>{p.status === 'declined' ? 'Declined' : 'Invitation pending'}</small>
                </span>
                {(isOwner || p.invitedBy === userId) && (
                  <button
                    type="button"
                    className="btn btn--sm btn--outline person-row__action"
                    disabled={busy}
                    onClick={() => run(() => cancelInvite(list.id, p.id))}
                  >
                    {p.status === 'declined' ? 'Clear' : 'Revoke'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <InviteLink list={list} isOwner={isOwner} onError={setError} />

      {confirm?.kind === 'remove' && (
        <ConfirmDialog
          title={`Remove ${confirm.person.name.split(' ')[0]}?`}
          body={`They lose access to ${name}. Dishes they saved stay in the list.`}
          confirmLabel="Remove"
          busyLabel="Removing…"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => run(() => removeMember(list.id, confirm.person.id))}
        />
      )}
    </Sheet>
  )
}
