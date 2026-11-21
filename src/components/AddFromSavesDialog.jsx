// "Add from My Saves" (spec 3.7): copy dishes from My Saves into a shared list. Dishes already in the
// list, and posts that were deleted, can't be picked. My Saves stays as it was.
import { useMemo, useState } from 'react'
import { addDishes } from '../lib/api'
import { groupItems, listName } from '../lib/lists'
import { refreshAfter, useListPage } from '../lib/queries'
import Icon from './Icon'
import Sheet from './Sheet'
import { DishPhoto, ErrorNote } from './ui'

const dishCount = (n) => `${n} dish${n === 1 ? '' : 'es'}`

export default function AddFromSavesDialog({ personal, list, inList, onClose, onAdded }) {
  const { data, error: loadError } = useListPage(personal.id)
  const items = useMemo(() => groupItems(data), [data])
  const [picked, setPicked] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const add = async () => {
    setBusy(true)
    setError(null)
    try {
      const n = await addDishes(list.id, [...picked])
      refreshAfter('want')
      onAdded(n)
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <Sheet
      title="Add from My Saves"
      subtitle={`Keep your saves. Add a copy to ${listName(list)}.`}
      onClose={onClose}
      busy={busy}
      footer={
        <button type="button" className="btn btn--gold btn--block" disabled={!picked.size || busy} onClick={add}>
          {busy ? 'Adding…' : picked.size ? `Add ${dishCount(picked.size)}` : 'Pick dishes to add'}
        </button>
      }
    >
      <ErrorNote error={error ?? loadError} />
      {!data ? (
        <p className="muted">Opening My Saves…</p>
      ) : !items.length ? (
        <p className="muted">My Saves is empty. Tap Want it on a dish to save it.</p>
      ) : (
        <ul className="list-checks">
          {items.map((item) => {
            const already = !item.deleted && inList.has(item.dish.id)
            const off = item.deleted || already
            const checked = already || picked.has(item.dish.id)
            return (
              <li key={item.key}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-disabled={off}
                  disabled={off}
                  className={checked ? 'list-check is-checked' : 'list-check'}
                  onClick={() => toggle(item.dish.id)}
                >
                  <span className="checkbox" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                  {item.deleted ? (
                    <span className="list-check__thumb list-check__thumb--empty" aria-hidden="true" />
                  ) : (
                    <DishPhoto dish={item.dish} className="list-check__thumb" />
                  )}
                  <span className="list-check__text">
                    <strong>{item.dish.name}</strong>
                    <small>{item.deleted ? 'Post deleted' : already ? 'Already added' : item.dish.restaurant.name}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
