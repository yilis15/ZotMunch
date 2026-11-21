// Edit profile (Figma 11–14 avatar series): pick one of seven avatars and change your name.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import { updateProfile } from '../lib/api'
import { refreshAfter } from '../lib/queries'
import { AVATARS, avatarSrc } from '../lib/avatars'
import Icon from '../components/Icon'
import { BackBar, ErrorNote } from '../components/ui'

export default function EditProfile() {
  const { userId, profile, email, reloadProfile } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? null)
  const [name, setName] = useState(profile?.display_name ?? '')
  // Opened by tapping the avatar on Me: show the avatar choices straight away.
  const [picking, setPicking] = useState(() => location.state?.pickAvatar === true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const nameMissing = !name.trim()

  const save = async () => {
    if (nameMissing) return
    setBusy(true)
    setError(null)
    try {
      await updateProfile(userId, { displayName: name.trim(), avatarUrl: avatar })
      await reloadProfile()
      refreshAfter('profile')
      navigate('/me', { replace: true })
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <BackBar title="Edit profile" to="/me" />

      <section className="profile-avatar">
        <button
          type="button"
          className="profile-avatar__current"
          onClick={() => setPicking((p) => !p)}
          aria-expanded={picking}
          aria-controls="avatar-choices"
        >
          <img src={avatarSrc(avatar)} alt="Your avatar" />
          <span className="profile-avatar__edit">
            <Icon name="edit" size={16} />
          </span>
        </button>
        <button type="button" className="link-btn" onClick={() => setPicking((p) => !p)}>
          {picking ? 'Done choosing' : 'Choose avatar'}
        </button>
      </section>

      {picking && (
        <section id="avatar-choices" className="avatar-grid" role="radiogroup" aria-label="Choose an avatar">
          {AVATARS.map((a) => (
            <button
              key={a.key}
              type="button"
              role="radio"
              aria-checked={avatar === a.value}
              className={avatar === a.value ? 'avatar-choice is-selected' : 'avatar-choice'}
              onClick={() => setAvatar(a.value)}
            >
              <img src={a.src} alt="" />
              <span>{a.label}</span>
              {avatar === a.value && (
                <span className="avatar-choice__check" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
              )}
            </button>
          ))}
        </section>
      )}

      <section className="field">
        <div className="field-label-row">
          <label className="field-label" htmlFor="profile-name">
            Name
          </label>
          <span className="field-required">Required</span>
        </div>
        <input
          id="profile-name"
          className={nameMissing ? 'input input--invalid' : 'input'}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameMissing || undefined}
        />
        {nameMissing && <p className="field-error">Name required. This is how other Anteaters see you.</p>}
      </section>

      <section className="field">
        <span className="field-label">Email</span>
        <p className="input input--readonly">{email}</p>
        <p className="field-hint">Your sign-in email. Only you can see it.</p>
      </section>

      <ErrorNote error={error} />
      <button type="button" className="btn btn--blue btn--block" onClick={save} disabled={busy || nameMissing}>
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </div>
  )
}
