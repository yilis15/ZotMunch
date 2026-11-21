// "Remove these dishes?" on Saved, in the same gold-edged style as deleting a draft. It lists every dish
// about to leave the list (scrolling inside the card when there are many), so a batch is easy to check.
// In a shared list (`listName`) it says the dishes leave for everyone there.
import { useEffect, useRef } from 'react'
import BiteDialog from './BiteDialog'
import { DELETED_MASCOT } from '../lib/deleted'
import { fallBackTo } from '../lib/photo'

const dishCount = (n) => `${n} dish${n === 1 ? '' : 'es'}`

function RemoveRow({ save: s }) {
  const { dish } = s
  return (
    <li className="remove-list__row">
      {s.deleted ? (
        <img className="remove-list__photo remove-list__photo--gone" src={`/mascots/${DELETED_MASCOT}.png`} alt="" />
      ) : dish.photo ? (
        <img
          className="remove-list__photo"
          src={dish.photoSmall ?? dish.photo}
          onError={fallBackTo(dish.photo)}
          alt=""
        />
      ) : (
        <span className="remove-list__photo remove-list__photo--empty" aria-hidden="true" />
      )}
      <span className="remove-list__text">
        <strong>{dish.name}</strong>
        <span className="meta">{s.deleted ? 'Post deleted' : dish.restaurant.name}</span>
      </span>
    </li>
  )
}

export default function RemoveSavesDialog({ saves, listName, onRemove, onKeep }) {
  const keepBtn = useRef(null)
  useEffect(() => keepBtn.current?.focus(), []) // the safe choice gets the focus
  const many = saves.length > 1

  return (
    <BiteDialog
      mascot="orange-hug"
      title={many ? `Remove ${dishCount(saves.length)}?` : 'Remove this dish?'}
      body={
        listName
          ? `This removes ${many ? 'them' : 'it'} for everyone in ${listName}. Other lists and everyone’s Tried it stay the same.`
          : 'It leaves your food list. You can undo right after.'
      }
      detail={
        <ul className={many ? 'remove-list remove-list--many' : 'remove-list'} aria-label="Dishes to remove">
          {saves.map((s) => (
            <RemoveRow key={s.key ?? s.id} save={s} />
          ))}
        </ul>
      }
      onCancel={onKeep}
    >
      <button type="button" className="btn btn--danger btn--block" onClick={onRemove}>
        {listName ? 'Remove for everyone' : many ? `Remove ${dishCount(saves.length)}` : 'Remove dish'}
      </button>
      <button ref={keepBtn} type="button" className="btn btn--outline btn--block" onClick={onKeep}>
        Keep
      </button>
    </BiteDialog>
  )
}
