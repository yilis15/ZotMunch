import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 5173 matches the redirect URL configured in Supabase Auth.
// GOOGLE_MAPS_* is exposed to the browser too: the Maps key is public by design and locked to our sites.
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'GOOGLE_MAPS_'],
  server: { port: 5173, strictPort: true },
})
