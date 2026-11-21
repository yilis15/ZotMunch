import { useCallback, useState } from 'react'

// Select mode and confirmed deletes for My posts and My reviews (Figma: Default · Selected · Confirm).
// `shown` is what's on screen after search: Select all and Delete only ever reach those, so a ticked
// item that a later search hides is never deleted. `remove(items)` deletes them on the server;
// `canDelete(item)` leaves some items out of Select.
export function useDeleteList({ shown, setItems, remove, canDelete = () => true }) {
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [pending, setPending] = useState(null) // the items waiting on the confirm dialog
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const deletable = (shown ?? []).filter(canDelete)
  const allSelected = deletable.length > 0 && deletable.every((i) => selected.has(i.id))

  const stop = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const confirm = async () => {
    const doomed = pending
    const ids = new Set(doomed.map((i) => i.id))
    setBusy(true)
    setError(null)
    try {
      await remove(doomed)
      setItems((all) => all.filter((i) => !ids.has(i.id)))
      setPending(null)
      stop()
    } catch (e) {
      setError(e)
      setPending(null)
    }
    setBusy(false)
  }

  return {
    selecting,
    start: () => setSelecting(true),
    stop,
    selected,
    toggle,
    allSelected,
    toggleAll: () => setSelected(allSelected ? new Set() : new Set(deletable.map((i) => i.id))),
    selectedItems: deletable.filter((i) => selected.has(i.id)),
    pending,
    ask: (list) => setPending(list),
    cancel: useCallback(() => setPending(null), []),
    confirm,
    busy,
    error,
  }
}
