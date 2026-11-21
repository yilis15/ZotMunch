// "Saved by" for one dish in a shared list: everyone who saved it, when, and whether they've tried it.
import { shortDate } from '../lib/format'
import Avatar from './Avatar'
import Sheet from './Sheet'

export default function SaversDialog({ item, userId, onClose }) {
  return (
    <Sheet title="Saved by" subtitle={item.dish.name} onClose={onClose}>
      <ul className="people-list">
        {item.savers.map((s, i) => (
          <li key={s.id ?? `gone-${i}`} className="person-row">
            <Avatar url={s.avatar} size={40} className={s.id ? '' : 'avatar--gone'} />
            <span className="person-row__text">
              <strong>
                {s.id ? s.name : 'Former member'}
                {s.id === userId && <span className="muted small"> (you)</span>}
              </strong>
              <small>
                {shortDate(s.savedAt)} · {s.tried ? 'Tried it ✓' : 'Not yet'}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
