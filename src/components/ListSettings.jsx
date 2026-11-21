// "List settings" (the ⚙ next to Invite on a shared list): the Owner renames or deletes the list (typing
// its name to confirm); an Editor leaves it. onGone runs after deleting or leaving (Saved opens My Saves).
import { useState } from 'react'
import { deleteList, leaveList } from '../lib/api'
import { listName } from '../lib/lists'
import { refreshAfter } from '../lib/queries'
import ConfirmDialog from './ConfirmDialog'
import CreateListDialog from './CreateListDialog'
import Sheet from './Sheet'
import { ErrorNote } from './ui'

export default function ListSettings({ list, userId, onClose, onGone }) {
  const [confirm, setConfirm] = useState(null) // 'delete' | 'leave'
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [renaming, setRenaming] = useState(false)
  const isOwner = list.ownerId === userId
  const name = listName(list)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await refreshAfter('members')
      onGone()
    } catch (e) {
      setError(e)
      setBusy(false)
      setConfirm(null)
    }
  }

  if (renaming) return <CreateListDialog list={list} onClose={onClose} />

  return (
    <Sheet title="List settings" subtitle={name} onClose={onClose} busy={busy}>
      <div className="list-settings">
        {isOwner ? (
          <>
            <button type="button" className="btn btn--outline btn--block" onClick={() => setRenaming(true)}>
              Rename list
            </button>
            <button type="button" className="btn btn--danger-text btn--block" onClick={() => setConfirm('delete')}>
              Delete list
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--danger-text btn--block" onClick={() => setConfirm('leave')}>
            Leave list
          </button>
        )}
        <ErrorNote error={error} />
      </div>

      {confirm === 'leave' && (
        <ConfirmDialog
          title={`Leave ${name}?`}
          body="Dishes you saved stay in the list. You’ll need a new invite to come back."
          confirmLabel="Leave list"
          busyLabel="Leaving…"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => run(() => leaveList(list.id))}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title={`Delete ${name} for everyone?`}
          body="Every dish in it goes away for all members. This can’t be undone."
          confirmLabel="Delete list"
          busy={busy}
          confirmDisabled={typed.trim() !== name}
          onCancel={() => {
            setConfirm(null)
            setTyped('')
          }}
          onConfirm={() => run(() => deleteList(list.id))}
        >
          <label className="field confirm__field">
            <span className="field-label">Type the list name to confirm</span>
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={name} />
          </label>
        </ConfirmDialog>
      )}
    </Sheet>
  )
}
