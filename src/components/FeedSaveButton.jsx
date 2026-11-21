// The bottom of a Feed card (spec 3.6b): "♡ Want it" when the dish isn't saved yet, "✓ Saved in …" when
// it is. Either opens the same Manage lists sheet as Dish detail (check several lists, Save changes), so
// a dish goes into or out of lists without opening its page. In Feed (`logAs` 'feed'), going from
// unsaved to saved also logs a Feed "want" swipe, like Want it on a dish opened from Feed.
import { useState } from 'react'
import { useApp } from '../lib/app'
import { recordSwipe } from '../lib/api'
import { listName, useSaveTargets } from '../lib/lists'
import { useDishLists } from '../lib/queries'
import Icon from './Icon'
import SaveToSheet from './SaveToSheet'

function ManageSheet({ dish, wasSaved, logAs, onClose }) {
  const { userId } = useApp()
  const { data } = useDishLists(dish.id)
  if (!data) return null // a moment while this dish's saves load
  return (
    <SaveToSheet
      mode="manage"
      dish={dish}
      dishSaves={data.saves}
      onClose={onClose}
      onDone={() => logAs && !wasSaved && recordSwipe(userId, dish.id, 'want', logAs).catch(() => {})}
    />
  )
}

export default function FeedSaveButton({ dish, listIds, logAs }) {
  const { lists } = useSaveTargets()
  const [open, setOpen] = useState(false)
  const saved = listIds?.length > 0
  const savedIn = saved && lists ? lists.filter((l) => listIds.includes(l.id)) : []
  const where = savedIn.length > 1 ? `${savedIn.length} lists` : savedIn.length ? listName(savedIn[0]) : 'My Saves'

  return (
    <>
      <button
        type="button"
        className={saved ? 'btn btn--soft btn--block dish-card__save is-saved' : 'btn btn--block dish-card__save dish-card__save--want'}
        onClick={() => setOpen(true)}
        disabled={listIds === undefined}
        aria-haspopup="dialog"
        aria-label={saved ? `Saved in ${where}. Manage lists for ${dish.name}` : `Want it: choose lists for ${dish.name}`}
      >
        <Icon name={saved ? 'check' : 'heart'} size={18} />
        <span>{saved ? `Saved in ${where}` : 'Want it'}</span>
        <Icon name="down" size={16} className="push-right" />
      </button>
      {open && <ManageSheet dish={dish} wasSaved={saved} logAs={logAs} onClose={() => setOpen(false)} />}
    </>
  )
}
