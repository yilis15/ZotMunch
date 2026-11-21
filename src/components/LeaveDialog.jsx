// "Save this bite for later?": shown when someone leaves Post with work that isn't published or saved.
// It shows what they've written so far, so they know which bite they're saving.
import { useEffect, useRef } from 'react'
import BiteDialog from './BiteDialog'

export default function LeaveDialog({ photo, name, restaurant, saving, onSave, onDiscard, onStay }) {
  const saveBtn = useRef(null)
  useEffect(() => saveBtn.current?.focus(), [])

  return (
    <BiteDialog
      mascot="orange-hug"
      title="Save this bite for later?"
      body="You haven't published it yet. Keep it as a draft and finish anytime."
      photo={photo}
      name={name}
      restaurant={restaurant}
      busy={saving}
      onCancel={onStay}
    >
      <button ref={saveBtn} type="button" className="btn btn--gold btn--block" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save draft'}
      </button>
      <button type="button" className="btn btn--outline btn--block btn--danger-text" onClick={onDiscard} disabled={saving}>
        Don't save
      </button>
      <button type="button" className="link-btn bite-dialog__stay" onClick={onStay} disabled={saving}>
        Keep editing
      </button>
    </BiteDialog>
  )
}
