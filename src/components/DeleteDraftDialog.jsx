// "Delete this draft?" on the Drafts page, in the same style as leaving Post. The draft's photos are
// deleted with it, so the dialog says so.
import { useEffect, useRef } from 'react'
import BiteDialog from './BiteDialog'

export default function DeleteDraftDialog({ photo, name, restaurant, deleting, onDelete, onKeep }) {
  const keepBtn = useRef(null)
  useEffect(() => keepBtn.current?.focus(), []) // the safe choice gets the focus

  return (
    <BiteDialog
      mascot="orange-hug"
      title="Delete this draft?"
      body="Its photos go too. This can't be undone."
      photo={photo}
      name={name}
      restaurant={restaurant}
      busy={deleting}
      onCancel={onKeep}
    >
      <button type="button" className="btn btn--danger btn--block" onClick={onDelete} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete draft'}
      </button>
      <button ref={keepBtn} type="button" className="btn btn--outline btn--block" onClick={onKeep} disabled={deleting}>
        Keep draft
      </button>
    </BiteDialog>
  )
}
