import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './lib/app'
import AppShell from './components/AppShell'
import { Loader } from './components/ui'
import Login from './pages/Login'
import Onboarding, { SKIP_KEY } from './pages/Onboarding'
import Discover from './pages/Discover'
import DishDetail from './pages/DishDetail'
import Restaurant from './pages/Restaurant'
import Saved from './pages/Saved'
import { Me, Post } from './pages/Placeholders'

function skippedOnboarding() {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

// Signed-in only. New users go through Everyday preferences once (unless they chose "Set up later").
function RequireAuth() {
  const { session, profile } = useApp()
  const { pathname } = useLocation()
  if (session === undefined) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Loader />
  if (!profile.onboarding_completed_at && !skippedOnboarding() && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

function LoginRoute() {
  const { session } = useApp()
  if (session === undefined) return <Loader />
  return session ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppShell />}>
          <Route index element={<Discover />} />
          <Route path="dish/:id" element={<DishDetail />} />
          <Route path="restaurant/:id" element={<Restaurant />} />
          <Route path="saved" element={<Saved />} />
          <Route path="post" element={<Post />} />
          <Route path="me" element={<Me />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
