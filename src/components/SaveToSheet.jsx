// Picking lists (spec 3.5 / 3.6). Two modes:
// - 'targets': "Save swipes to…" — where Swipe and Want it save. Each tap applies at once; the last
//   checked list can't be unchecked.
// - 'manage': "Manage lists" for one dish already saved — check and uncheck, then Save changes.
//   Unchecking a shared list removes the dish for everyone there, so it says so first.
// Every row is one big tap target (56px+). "+ New list" makes a list and checks it.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setDishLists } from '../lib/api'
import { listName, memberWord, useSaveTargets } from '../lib/lists'
import { refreshAfter } from '../lib/queries'
import CreateListDialog from './CreateListDialog'
import Icon from './Icon'
import Sheet from './Sheet'
import { ErrorNote } from './ui'

function ListRow({ list, checked, onToggle, note, warn, shake }) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={['list-check', checked && 'is-checked', shake && 'is-shaking'].filter(Boolean).join(' ')}
        onClick={onToggle}
      >
        <span className="checkbox" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        <span className="list-check__icon" aria-hidden="true">
          {list.kind === 'personal' ? '♥' : '👥'}
        </span>
        <span className="list-check__text">
          <strong>{listName(list)}</strong>
          <small>{note}</small>
        </span>
      </button>
      {warn && (
        <p className="list-check__warn" role="status">
          {warn}
        </p>
      )}
    </li>
  )
}

const listNote = (l) => (l.kind === 'personal' ? 'Private · Just you' : memberWord(l.memberCount))

export default function SaveToSheet({ mode = 'targets', dish, dishSaves = [], onClose, onDone }) {
  const { lists, targets, setTargets } = useSaveTargets()
  const inLists = new Set(dishSaves.map((s) => s.listId))
  const [checked, setChecked] = useState(() => (mode === 'manage' ? inLists : new Set(targets.map((t) => t.id))))
  const [shake, setShake] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState(null)

  const toggle = (id) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (mode === 'targets') {
      if (!next.size) {
        setShake(id)
        setHint('Keep at least one list.')
        setTimeout(() => setShake(null), 400)
        return
      }
      setTargets([...next])
    }
    setHint(null)
    setChecked(next)
  }

  const created = (id) => {
    setCreating(false)
    const next = new Set(checked).add(id)
    setChecked(next)
    if (mode === 'targets') setTargets([...next])
  }

  const changed = mode === 'manage' && (checked.size !== inLists.size || [...checked].some((id) => !inLists.has(id)))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await setDishLists(dish.id, [...checked])
      refreshAfter('want')
      onDone?.()
      onClose()
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  const saversIn = (listId) => {
    const names = dishSaves.filter((s) => s.listId === listId).map((s) => s.name?.split(' ')[0] ?? 'someone')
    return names.length ? `Saved by ${names.join(', ')}` : null
  }

  if (creating) return <CreateListDialog onClose={() => setCreating(false)} onCreated={created} />

  const manage = mode === 'manage'
  return (
    <Sheet
      title={manage ? 'Manage lists' : 'Save swipes to…'}
      subtitle={manage ? `Choose which lists have ${dish.name}.` : 'Right swipes and Want it go to every list you check.'}
      onClose={onClose}
      busy={busy}
      footer={
        manage ? (
          <div className="list-sheet__foot">
            <button type="button" className="btn btn--gold btn--block" disabled={!changed || busy} onClick={save}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            {inLists.size > 0 && (
              <Link className="link-btn" to={`/saved?list=${[...inLists][0]}`} onClick={onClose}>
                Go to Saved
              </Link>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn--gold btn--block" onClick={onClose}>
            Done
          </button>
        )
      }
    >
      {!lists ? (
        <p className="muted">Loading your lists…</p>
      ) : (
        <ul className="list-checks">
          {lists.map((l) => (
            <ListRow
              key={l.id}
              list={l}
              checked={checked.has(l.id)}
              onToggle={() => toggle(l.id)}
              shake={shake === l.id}
              note={(manage && inLists.has(l.id) && l.kind === 'shared' && saversIn(l.id)) || listNote(l)}
              warn={
                manage && l.kind === 'shared' && inLists.has(l.id) && !checked.has(l.id)
                  ? `This removes it for everyone in ${listName(l)}.`
                  : null
              }
            />
          ))}
          <li>
            <button type="button" className="list-check list-check--new" onClick={() => setCreating(true)}>
              <span className="list-check__icon" aria-hidden="true">
                +
              </span>
              <span className="list-check__text">
                <strong>New list</strong>
              </span>
            </button>
          </li>
        </ul>
      )}
      {hint && (
        <p className="field-error" role="status">
          {hint}
        </p>
      )}
      <ErrorNote error={error} />
    </Sheet>
  )
}
