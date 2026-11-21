// "Create a shared list" (spec 3.2): a name of 1–40 characters. onCreated gets the new list's id.
// Also used to rename a list (pass `list`).
import { useState } from 'react'
import { createList, renameList } from '../lib/api'
import { NAME_MAX } from '../lib/lists'
import { refreshAfter } from '../lib/queries'
import Sheet from './Sheet'
import { ErrorNote } from './ui'

export default function CreateListDialog({ list, onClose, onCreated }) {
  const [name, setName] = useState(list?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [tried, setTried] = useState(false)
  const trimmed = name.trim()
  const problem = !trimmed ? 'Give your list a name.' : trimmed.length > NAME_MAX ? `Keep it to ${NAME_MAX} characters.` : null

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    if (problem) return
    setBusy(true)
    setError(null)
    try {
      if (list) {
        await renameList(list.id, trimmed)
        refreshAfter('lists')
        onClose()
      } else {
        const id = await createList(trimmed)
        await refreshAfter('lists') // so the new list is there to open
        onCreated(id)
      }
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={list ? 'Rename list' : 'Create a shared list'}
      subtitle={list ? null : 'Good food is better together!'}
      onClose={onClose}
      busy={busy}
    >
      <form className="list-form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">List name</span>
          <input
            className={tried && problem ? 'input input--invalid' : 'input'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Food Hunt"
            maxLength={NAME_MAX + 10}
            autoFocus
            aria-invalid={Boolean(tried && problem)}
          />
          <span className="field-hint">
            {trimmed.length}/{NAME_MAX}
          </span>
          {tried && problem && <span className="field-error">{problem}</span>}
        </label>
        {!list && <p className="muted small">Invite people now or later. Your list is ready either way.</p>}
        <ErrorNote error={error} />
        <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
          {busy ? 'Saving…' : list ? 'Save name' : 'Create list'}
        </button>
      </form>
    </Sheet>
  )
}
