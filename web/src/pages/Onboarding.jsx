// Everyday preferences (Figma 02): long-term diets and allergies. Also reachable later from Me.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import { savePreferences } from '../lib/api'
import { BackBar, Chip, ErrorNote } from '../components/ui'

export const SKIP_KEY = 'zotmunch.onboardingSkipped'

const GROUPS = [
  { category: 'dietary', title: 'Dietary preferences', none: 'No restrictions' },
  { category: 'allergy', title: 'Allergies', none: 'No allergies' },
]

export default function Onboarding() {
  const { userId, tags, preferenceTagIds, reloadProfile } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(preferenceTagIds)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => setSelected(preferenceTagIds), [preferenceTagIds])

  const idsIn = (category) => tags.filter((t) => t.category === category).map((t) => t.id)
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const clearGroup = (category) => setSelected((s) => s.filter((id) => !idsIn(category).includes(id)))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await savePreferences(userId, selected)
      await reloadProfile()
      navigate('/', { replace: true })
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  const later = () => {
    try {
      sessionStorage.setItem(SKIP_KEY, '1')
    } catch {
      // Private mode: the user will just be asked again next time.
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="page page--narrow">
      <BackBar title="Everyday preferences" to="/" />
      <p className="muted lead">Set your food preferences and allergies. We'll personalize your recommendations.</p>

      {GROUPS.map(({ category, title, none }) => {
        const ids = idsIn(category)
        const noneSelected = !ids.some((id) => selected.includes(id))
        return (
          <section key={category} className="pref-group">
            <div className="filter-group__head">
              <h2 className="title title--sm">{title}</h2>
              <span className="muted small">Select all that apply</span>
            </div>
            <div className="chips">
              {tags
                .filter((t) => t.category === category)
                .map((t) => (
                  <Chip key={t.id} selected={selected.includes(t.id)} onClick={() => toggle(t.id)}>
                    {t.name}
                  </Chip>
                ))}
              <Chip selected={noneSelected} onClick={() => clearGroup(category)}>
                {none}
              </Chip>
            </div>
          </section>
        )
      })}

      <p className="muted small">Dishes with your allergens are hidden. Missing allergen information is marked as unknown.</p>
      <ErrorNote error={error} />
      <div className="stack">
        <button type="button" className="btn btn--blue btn--block" onClick={save} disabled={busy}>
          Save preferences
        </button>
        <button type="button" className="link-btn" onClick={later}>
          Set up later
        </button>
      </div>
    </div>
  )
}
