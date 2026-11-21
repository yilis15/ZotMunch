import { useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './lib/app'
import { supabase } from './lib/supabase'
import { pendingJoin, setPendingJoin } from './lib/lists'
import AppShell from './components/AppShell'
import { EmptyState, Loader } from './components/ui'
import Login from './pages/Login'
import Onboarding, { SKIP_KEY } from './pages/Onboarding'
import Discover from './pages/Discover'
import DishDetail from './pages/DishDetail'
import Restaurant from './pages/Restaurant'
import Saved from './pages/Saved'
import Post from './pages/Post'
import Review from './pages/Review'
import Me from './pages/Me'
import EditProfile from './pages/EditProfile'
import MyPosts from './pages/MyPosts'
import EditPost from './pages/EditPost'
import Drafts from './pages/Drafts'
import MyReviews from './pages/MyReviews'
import Join from './pages/Join'
import Person from './pages/Person'

function skippedOnboarding() {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

// Signed-in only. New users go through Everyday preferences once (unless they chose "Set up later").
function LoadFailed() {
  const { loadError, retryLoad } = useApp()
  const [busy, setBusy] = useState(false)
  return (
    <div className="page page--narrow">
      <EmptyState
        mascot="sleep"
        title="We couldn't open ZotMunch."
        actions={
          <>
            <button
              type="button"
              className="btn btn--blue btn--block"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await retryLoad()
                setBusy(false)
              }}
            >
              {busy ? 'Trying again…' : 'Try again'}
            </button>
            <button type="button" className="btn btn--outline btn--block" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </>
        }
      >
        {/fetch|network/i.test(loadError?.message ?? '')
          ? "We couldn't reach the server. Check your internet connection and try again."
          : (loadError?.message ?? 'Something went wrong while loading your profile.')}
      </EmptyState>
    </div>
  )
}

const JOIN_PATH = /^\/join\/([^/]+)$/

function RequireAuth() {
  const { session, profile, tags, loadError } = useApp()
  const { pathname } = useLocation()
  if (session === undefined) return <Loader />
  if (!session) {
    // An invite link opened while signed out: remember it through sign-in (and onboarding).
    const join = pathname.match(JOIN_PATH)
    if (join) setPendingJoin(decodeURIComponent(join[1]))
    return <Navigate to="/login" replace />
  }
  if (loadError) return <LoadFailed />
  if (!profile || !tags.length) return <Loader />
  if (!profile.onboarding_completed_at && !skippedOnboarding() && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  const join = pendingJoin()
  if (join && pathname !== '/onboarding' && !JOIN_PATH.test(pathname)) {
    return <Navigate to={`/join/${encodeURIComponent(join)}`} replace />
  }
  return <Outlet />
}

function LoginRoute() {
  const { session } = useApp()
  if (session === undefined) return <Loader />
  const join = pendingJoin()
  return session ? <Navigate to={join ? `/join/${encodeURIComponent(join)}` : '/'} replace /> : <Login />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
        {/* Outside AppShell, so the first-time guide waits until after joining. */}
        <Route path="/join/:token" element={<Join />} />
        <Route element={<AppShell />}>
          <Route index element={<Discover />} />
          <Route path="dish/:id" element={<DishDetail />} />
          <Route path="dish/:id/review" element={<Review />} />
          <Route path="restaurant/:id" element={<Restaurant />} />
          <Route path="people/:id" element={<Person />} />
          <Route path="saved" element={<Saved />} />
          <Route path="post" element={<Post />} />
          <Route path="me" element={<Me />} />
          <Route path="me/profile" element={<EditProfile />} />
          <Route path="me/posts" element={<MyPosts />} />
          <Route path="me/posts/:id/edit" element={<EditPost />} />
          <Route path="me/drafts" element={<Drafts />} />
          <Route path="me/reviews" element={<MyReviews />} />
          <Route path="me/preferences" element={<Onboarding edit />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
