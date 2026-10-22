# ZotMunch web

React + Vite front end for ZotMunch, built from the Figma storyboard (mobile first, sidebar layout from 768px).

## Run

```
npm install
npm run dev        # http://localhost:5173
```

`.env.local` holds the Supabase URL and publishable key (copy `.env.example`).

## What's here

- Login (Google or emailed code) → Everyday preferences → Discover (Swipe / Feed + temporary filters)
- Dish details, Other popular dishes, Saved (Not yet ⇄ Tried it)
- Post and Me are placeholders for the next round

All queries live in `src/lib/api.js`. Demo dishes come from `../supabase/seed.sql`; their photos are in `public/seed/`.
