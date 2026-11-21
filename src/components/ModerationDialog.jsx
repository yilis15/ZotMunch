// "We can't post this yet": shown when the content check stops a post or review. Lists each photo and
// field it turned down and why, under the anteater officer. "Fix it" closes it; the form still marks
// the same photos and fields, so the user can see what to change.
import { useEffect, useRef } from 'react'
import BiteDialog from './BiteDialog'
import Icon from './Icon'

const PHOTO_REASON = {
  not_food: "This photo doesn't look like food.",
  unsafe: "This photo isn't allowed on ZotMunch.",
}
const TEXT_REASON = {
  name: "The dish name has words we can't post.",
  body: "Your note has words we can't post.",
}

// `rejection` is { photos: [{ key, url, verdict }], texts: ['name' | 'body', …] }.
export default function ModerationDialog({ rejection, onClose }) {
  const fixBtn = useRef(null)
  useEffect(() => fixBtn.current?.focus(), [])

  const count = rejection.photos.length + rejection.texts.length
  return (
    <BiteDialog
      hero="/mascots/police.jpg"
      title="We can't post this yet"
      body={`Our food patrol stopped ${count === 1 ? 'one thing' : `${count} things`}. Fix ${count === 1 ? 'it' : 'these'} and try again:`}
      onCancel={onClose}
      detail={
        <ul className="reject-list">
          {rejection.photos.map((p) => (
            <li key={p.key} className="reject-item">
              <img
                className={p.verdict === 'unsafe' ? 'reject-item__thumb reject-item__thumb--blur' : 'reject-item__thumb'}
                src={p.url}
                alt=""
              />
              <span>{PHOTO_REASON[p.verdict]}</span>
            </li>
          ))}
          {rejection.texts.map((field) => (
            <li key={field} className="reject-item">
              <span className="reject-item__thumb reject-item__thumb--icon" aria-hidden="true">
                <Icon name="edit" size={20} />
              </span>
              <span>{TEXT_REASON[field]}</span>
            </li>
          ))}
        </ul>
      }
    >
      <button ref={fixBtn} type="button" className="btn btn--gold btn--block" onClick={onClose}>
        Fix it
      </button>
    </BiteDialog>
  )
}
