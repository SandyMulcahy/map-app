# Routes

Plot running routes on a map by clicking points, see the distance as you go,
and save them to your account.

- Draw without an account; log in or sign up to save.
- Each saved route can be shown or hidden, renamed, recoloured, zoomed to, or deleted.
- Routes are private to the account that made them.

Built with React, Vite, TypeScript, Leaflet (OpenStreetMap) and Supabase.
Hosted free on GitHub Pages.

## Getting started

```bash
npm install
npm run dev
```

The map and drawing work straight away. Logging in and saving need a Supabase
project: see [SETUP.md](SETUP.md), sections 1 to 3.

## Deploying to GitHub Pages

The app is a static site that talks to Supabase directly from the browser, so
Supabase plus GitHub Pages is all it needs. No Vercel account or server required.

GitHub Pages is free for **public** repositories. A private repository needs a
paid GitHub plan (or use Vercel instead, below).

The build and publish steps are already in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). One-off setup,
all on the repository's page on GitHub:

1. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables tab → New repository
   variable.** Add two, with the same values as your `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   They go under *Variables*, not *Secrets*: both are public values that end up
   in the browser anyway, and the workflow reads them as variables.
3. Push to `main`, or open the **Actions** tab, pick **Deploy to GitHub Pages**
   and press **Run workflow**.

After a minute or two the site is live at
`https://sandymulcahy.github.io/map-app/`. Every later push to `main`
redeploys it. If you change the two variables, re-run the workflow, because
they are baked in at build time.

Optional: in Supabase, **Authentication → URL Configuration**, set **Site URL**
to that address. Nothing depends on it while email confirmation is off.

### If something goes wrong

| Symptom | Cause |
|---|---|
| Workflow fails at the deploy step | Pages source isn't set to **GitHub Actions** (step 1). |
| Site loads but says "Accounts are not set up yet" | The two variables are missing, misnamed, or were added as secrets; fix them and re-run the workflow. |
| Blank page | An old build from before `base: './'` was added to `vite.config.ts`; re-run the workflow. |
| `npm ci` fails | `package-lock.json` isn't committed. Run `npm install` and commit it. |

### Vercel instead

Vercel still works and is the option for a private repository; see
[SETUP.md](SETUP.md), section 4. Use one host or the other: if you stay on
Vercel, delete `.github/workflows/deploy.yml` so the Pages workflow doesn't run.

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
.github/workflows/
  deploy.yml              builds and publishes to GitHub Pages
```

## Scripts

- `npm run dev` – local dev server
- `npm run build` – production build into `dist/`
- `npm run typecheck` – TypeScript check
