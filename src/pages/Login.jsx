// Welcome / login (Figma 01): Anteater login (Google) first, or a one-time code sent to any email.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ErrorNote } from '../components/ui'
import { pendingJoin } from '../lib/lists'

const RESEND_SECONDS = 60

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [wait, setWait] = useState(0) // seconds until another code can be sent (Supabase allows one a minute)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!wait) return undefined
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const google = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    })

  const requestCode = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    if (error) throw error
    setWait(RESEND_SECONDS)
  }

  const sendCode = (e) => {
    e.preventDefault()
    run(async () => {
      await requestCode()
      setResent(false)
      setStep('code')
    })
  }

  const resend = () =>
    run(async () => {
      setResent(false)
      await requestCode()
      setResent(true)
    })

  // On success the auth listener in AppProvider picks up the session and the router moves on.
  const verify = (e) => {
    e.preventDefault()
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
      if (error) throw error
    })
  }

  return (
    <div className="login">
      <div className="login__art">
        <span className="sparkle sparkle--1" aria-hidden="true">✦</span>
        <span className="sparkle sparkle--2" aria-hidden="true">✦</span>
        <span className="sparkle sparkle--3" aria-hidden="true">✦</span>
        <img src="/mascots/hero.png" alt="An anteater about to eat a stack of pancakes" />
      </div>

      <div className="login__panel">
        <h1 className="wordmark wordmark--lg">
          Zot<span>Munch</span>
        </h1>
        <p className="login__tagline">Scroll, drool, munch, repeat!</p>
        {pendingJoin() && (
          <p className="banner banner--gold login__join" role="status">
            <strong>Sign in to join a shared list.</strong>
            <span>You’ll see the invitation right after.</span>
          </p>
        )}
        <p className="muted small center">Your next happy bite starts here.</p>

        {step === 'email' ? (
          <>
            <button
              type="button"
              className="btn btn--gold btn--block"
              onClick={google}
              disabled={busy}
              aria-label="Anteater login with Google"
            >
              Anteater login
            </button>
            <div className="divider">
              <span>or use email</span>
            </div>
            <form onSubmit={sendCode} className="stack">
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@uci.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn--outline btn--block" disabled={busy || !email.trim()}>
                Continue with email
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={verify} className="stack">
            <p className="center small">
              We sent a code to <strong>{email.trim()}</strong>.
            </p>
            <p className="login__hint">
              Can't find the code? Please check your spam folder.
            </p>
            <label className="sr-only" htmlFor="code">
              Code from your email
            </label>
            <input
              id="code"
              className="input input--code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
            <button type="submit" className="btn btn--blue btn--block" disabled={busy || code.length < 6}>
              Sign in
            </button>
            <div className="login__links">
              <button type="button" className="link-btn" onClick={resend} disabled={busy || wait > 0}>
                {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
              </button>
              <span className="login__dot" aria-hidden="true">·</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setResent(false)
                }}
              >
                Use a different email
              </button>
            </div>
            {resent && (
              <p className="login__hint" role="status">
                New code sent. Use the newest email.
              </p>
            )}
          </form>
        )}
        <ErrorNote error={error} />
      </div>
    </div>
  )
}
