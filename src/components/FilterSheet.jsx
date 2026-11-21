// Temporary filters (Figma 06): a bottom sheet on phones, a right-side panel on wider screens.
import { useEffect, useState } from 'react'
import { useApp } from '../lib/app'
import { useDiscoverCount } from '../lib/queries'
import { BUDGETS, DISTANCES, EMPTY_FILTERS, FILTER_CATEGORIES } from '../lib/discover'

const COUNT_DELAY_MS = 250 // wait for the taps to settle before asking the database
import Icon from './Icon'
import { Chip } from './ui'

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export default function FilterSheet({ onClose }) {
  const { tags, filters, setFilters } = useApp()
  const [draft, setDraft] = useState(filters)
  // The count follows the draft once the taps settle; a count already asked for comes from the cache.
  const [counted, setCounted] = useState(draft)
  useEffect(() => {
    const timer = setTimeout(() => setCounted(draft), COUNT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft])
  const { data: matches = null } = useDiscoverCount(counted) // null until the first count arrives

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  const apply = () => {
    setFilters(draft)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <div>
            <h2 id="filters-title" className="title title--sm">
              Filters
            </h2>
            <p className="muted small">Just for this browse.</p>
          </div>
          <button type="button" className="icon-btn icon-btn--soft" onClick={onClose} aria-label="Close filters">
            <Icon name="close" />
          </button>
        </header>

        <div className="sheet__body">
          {FILTER_CATEGORIES.map(([category, label]) => (
            <section key={category} className="filter-group">
              <div className="filter-group__head">
                <h3>{label}</h3>
                <span className="muted small">Select any</span>
              </div>
              <div className="chips">
                {tags
                  .filter((t) => t.category === category)
                  .map((t) => (
                    <Chip
                      key={t.id}
                      selected={draft.tagIds.includes(t.id)}
                      onClick={() => setDraft({ ...draft, tagIds: toggle(draft.tagIds, t.id) })}
                    >
                      {t.name}
                    </Chip>
                  ))}
              </div>
            </section>
          ))}
          <section className="filter-group">
            <div className="filter-group__head">
              <h3>Budget</h3>
              <span className="muted small">Select any</span>
            </div>
            <div className="chips">
              {BUDGETS.map((b) => (
                <Chip
                  key={b.id}
                  selected={draft.budgets.includes(b.id)}
                  onClick={() => setDraft({ ...draft, budgets: toggle(draft.budgets, b.id) })}
                >
                  {b.label}
                </Chip>
              ))}
            </div>
          </section>
          <section className="filter-group">
            <div className="filter-group__head">
              <h3>Distance</h3>
              <span className="muted small">Pick one</span>
            </div>
            <div className="chips">
              {DISTANCES.map((d) => (
                <Chip
                  key={d.id}
                  selected={draft.distance === d.id}
                  onClick={() => setDraft({ ...draft, distance: draft.distance === d.id ? null : d.id })}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </section>
        </div>

        <footer className="sheet__foot">
          <button type="button" className="btn btn--outline" onClick={() => setDraft(EMPTY_FILTERS)}>
            Clear all
          </button>
          <button type="button" className="btn btn--gold btn--grow" onClick={apply}>
            {matches == null ? 'Show dishes' : `Show ${matches} dish${matches === 1 ? '' : 'es'}`}
          </button>
        </footer>
      </div>
    </div>
  )
}
