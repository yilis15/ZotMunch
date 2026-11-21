// "Saving to · My Saves + Weekend…  ›" above the card on Swipe and under Want it on Dish detail (spec 3.5):
// a whole row to tap (48px, nothing else on it) that opens "Save swipes to…". It is drawn like Saved's list
// picker (same frame and round badge), since both pick lists. Only for people with a shared list.
import { listName, targetsText } from '../lib/lists'
import Icon from './Icon'

export default function SavingToRow({ targets, onClick }) {
  const names = targets.map(listName)
  const anyShared = targets.some((l) => l.kind === 'shared')
  return (
    <button
      type="button"
      className="saving-to"
      onClick={onClick}
      aria-label={`Saving to ${names.join(' and ')}. Change`}
    >
      <span className="list-menu__icon" aria-hidden="true">
        {anyShared ? '👥' : '♥'}
      </span>
      <span className="saving-to__text">
        <span className="saving-to__label">Saving to</span>
        <span className="saving-to__names">{targetsText(targets)}</span>
      </span>
      <Icon name="chevron" size={18} className="saving-to__chevron" />
    </button>
  )
}
