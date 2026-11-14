import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { BackBar, ErrorNote } from '../components/ui'
import { useApp } from '../lib/app'
import { saveProfileAvatar } from '../lib/api'

const AVATARS = [
  { name: 'Hello', src: '/mascots/hero.png' },
  { name: 'Mug', src: '/mascots/mug.png' },
  { name: 'Cookie', src: '/mascots/cookie.png' },
  { name: 'Orange', src: '/mascots/orange-hug.png' },
  { name: 'Sleep', src: '/mascots/sleep.png' },
  { name: 'Sparkle', src: '/mascots/orange-burst.png' },
]

export default function EditProfile() {
  const { profile, userId, reloadProfile } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(profile?.avatar_url || '/mascots/mug.png')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (window.location.hash === '#change-profile-picture') {
      document.getElementById('change-profile-picture')?.scrollIntoView()
    }
  }, [])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await saveProfileAvatar(userId, selected)
      await reloadProfile()
      navigate('/me')
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow edit-profile">
      <BackBar title="Edit profile" to="/me" />
      <section id="change-profile-picture" className="avatar-editor" aria-labelledby="avatar-editor-title">
        <img className="avatar-editor__preview" src={selected} alt="" />
        <h2 id="avatar-editor-title" className="title title--sm">Change Profile Picture</h2>
        <p className="muted small">Choose your Anteater avatar.</p>
        <div className="avatar-grid" role="group" aria-label="Choose an avatar">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.src}
              type="button"
              className={`avatar-option${selected === avatar.src ? ' avatar-option--selected' : ''}`}
              aria-pressed={selected === avatar.src}
              onClick={() => setSelected(avatar.src)}
            >
              <img src={avatar.src} alt="" />
              <span>{avatar.name}</span>
              {selected === avatar.src && <Icon name="check" className="avatar-option__check" size={18} />}
            </button>
          ))}
        </div>
      </section>
      <ErrorNote error={error} />
      <button type="button" className="btn btn--blue btn--block" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save profile picture'}
      </button>
    </div>
  )
}
