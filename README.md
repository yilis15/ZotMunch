# ZotMunch web

React + Vite front end for ZotMunch, built from the Figma storyboard (mobile first, sidebar layout from 768px).

## Run

```
npm install
npm run dev        # http://localhost:5173
```

`.env.local` holds the Supabase URL and publishable key (copy `.env.example`).

`GOOGLE_MAPS_API_KEY` (or `VITE_GOOGLE_MAPS_API_KEY`) is optional. With it, Post searches restaurants on Google Maps (Places API (New) and
Maps JavaScript API, enabled in Google Cloud; restrict the key to `http://localhost:5173/*` and the Vercel URL).
Without it, Post searches restaurants already in the database. On Vercel, add the same variable under
Settings → Environment Variables and redeploy.

## What's here

- Login (Google or emailed code) → Everyday preferences → Discover (Swipe / Feed + temporary filters)
- Dish details with reviews and photos, Other popular dishes, Saved (Not yet ⇄ Tried it, swipe or select to remove)
- Post: photos, dish name, restaurant, duplicate check, price, rating, note, optional tags, drafts
- Write a review: rating, note, photos, tag updates
- Me: Edit profile (avatars), Manage posts, Drafts, My reviews, Food preferences

All queries live in `src/lib/api.js`. Demo dishes come from `../supabase/seed.sql`; their photos are in `public/seed/`.
