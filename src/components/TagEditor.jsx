// Dish tags (Figma 14): every tag group, all optional. `locked` tags were added by other people
// and can't be removed by this user.
import { useEffect, useState } from 'react'
import { useApp } from '../lib/app'
import { FILTER_CATEGORIES } from '../lib/discover'
import { BackBar, Chip } from './ui'

const TAG_GROUPS = [['dietary', 'Dietary'], ['allergy', 'Allergens'], ...FILTER_CATEGORIES]

export default function TagEditor({ selected, locked = new Set(), onDone, onClose }) {
  const { tags } = useApp()
  const [draft, setDraft] = useState(selected)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  const toggle = (id) => {
    if (locked.has(id)) return
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  }

  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-labelledby="tag-editor-title">
      <div className="fullscreen__body">
        <div className="page page--narrow">
          <BackBar title="Dish tags" onBack={onClose} />
          <div>
            <h2 id="tag-editor-title" className="title title--sm">
              Add what you know.
            </h2>
            <p className="muted small">Review or update the dish's tags. Every tag is optional.</p>
          </div>
          {locked.size > 0 && (
            <p className="muted small">Tags with a lock were added by other Anteaters, so they stay.</p>
          )}
          {TAG_GROUPS.map(([category, label]) => (
            <section key={category}>
              <div className="filter-group__head">
                <h3>{label}</h3>
                <span className="muted small">Select all that apply</span>
              </div>
              <div className="chips">
                {tags
                  .filter((t) => t.category === category)
                  .map((t) => (
                    <Chip key={t.id} selected={draft.includes(t.id)} onClick={() => toggle(t.id)}>
                      {locked.has(t.id) && <span aria-label="added by others">🔒 </span>}
                      {t.name}
                    </Chip>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <footer className="fullscreen__foot">
        <button type="button" className="btn btn--blue btn--block" onClick={() => onDone(draft)}>
          Done
        </button>
      </footer>
    </div>
  )
}
