import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppProvider } from './lib/app'
import { queryClient } from './lib/queries'
import App from './App'
import './styles/app.css'

// A data router, so pages can use useBlocker (Post asks before unsaved work is lost). One catch-all
// route renders the app; App's own <Routes> still decide every page, so no URL changes.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AppProvider>
        <App />
      </AppProvider>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
