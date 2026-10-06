# Routes

Plot running routes on a map by clicking points, see the distance as you go,
and save them to your account.

- Draw without an account; log in or sign up to save.
- Each saved route can be shown or hidden, renamed, recoloured, zoomed to, or deleted.
- Routes are private to the account that made them.

Built with React, Vite, TypeScript, Leaflet (OpenStreetMap) and Supabase.

## Getting started

See [SETUP.md](SETUP.md) for Supabase, GitHub and Vercel setup.

```bash
npm install
npm run dev
```

## Layout

```
src/
  App.tsx                 state and page layout
  components/
    MapView.tsx           map, route lines, click-to-add-point, location
    DraftPanel.tsx        the route being drawn: distance, undo, clear, save
    RouteList.tsx         saved routes: toggle, colour, rename, delete
    AuthDialog.tsx        log in / sign up
  lib/
    geo.ts                distance maths and the colour palette
    routesApi.ts          database reads and writes
    supabase.ts           Supabase client
    useAuth.ts            current user
    storage.ts            safe localStorage helpers
  styles.css
supabase/schema.sql       table and row-level security
```

## Scripts

- `npm run dev` – local dev server
- `npm run build` – production build into `dist/`
- `npm run typecheck` – TypeScript check
