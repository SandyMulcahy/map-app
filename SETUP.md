# Setup

Everything here is on free tiers. Roughly 15 minutes end to end.

Dashboard menus get renamed from time to time, so if a label below doesn't match
exactly, look for the nearest equivalent.

## 0. Before you start

You need [Node.js](https://nodejs.org) 20 or newer (`node -v` to check) and Git.

## 1. Run it locally (no accounts yet)

```bash
cd ~/Documents/Projects/map-app
npm install
npm run dev
```

Open the address it prints (normally http://localhost:5173). You should see the
map and be able to click out a route. Logging in and saving won't work until
step 2 is done; the app tells you so if you try.

`npm install` also creates `package-lock.json`. Commit that file.

## 2. Supabase (database and login)

1. Go to https://supabase.com/dashboard and choose **New project**. The free plan
   allows two active projects, so this is your second.
   - Name: anything, e.g. `map-app`.
   - Database password: generate one and store it somewhere. The app never uses it.
   - Region: London (or whichever is nearest).
2. Wait for the project to finish setting up (a minute or two).
3. **Create the table.** Open **SQL Editor**, start a new query, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It should
   report success with no rows returned. If it warns about a "destructive
   operation", that is the `drop policy if exists` lines; it's fine to run.
4. **Turn off email confirmation.** Go to **Authentication → Sign In / Providers →
   Email**, switch **Confirm email** off, and save. Leave the Email provider
   itself enabled.
5. **Copy the two values the app needs.** In **Project Settings** (or the
   **Connect** button at the top of the dashboard) find:
   - the **Project URL**, like `https://abcdefgh.supabase.co`
   - the **publishable key** (starts `sb_publishable_`). On older-style projects
     this is called the **anon public** key instead; either works.

   Do **not** use the secret / `service_role` key. That one bypasses all security
   and must never go in a browser app.
6. In the project folder, copy `.env.example` to `.env.local` and fill it in:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
   ```

   `.env.local` is git-ignored, so it won't be pushed.
7. Stop the dev server (Ctrl+C) and run `npm run dev` again, since Vite only reads
   env files at start-up.

### Check it works

- Sign up with an email and password. You should be logged in straight away.
- Draw a route, save it, refresh the page: it should still be there.
- In Supabase, **Table Editor → routes** should show the row.
- Sign up as a second user (a private window helps): their list should be empty.

## 3. GitHub

```bash
cd ~/Documents/Projects/map-app
git init
git add .
git commit -m "Initial commit"
```

Create an empty repository on GitHub (no README or .gitignore), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/map-app.git
git branch -M main
git push -u origin main
```

Before pushing, `git status` should **not** list `.env.local` or `node_modules`.

## 4. Vercel (hosting)

Your existing Vercel project is not a problem: the free Hobby plan allows many
projects.

1. Go to https://vercel.com/new and import the `map-app` repository. If it isn't
   listed, use **Adjust GitHub App Permissions** to give Vercel access to it.
2. Vercel should detect **Vite** by itself. Leave the defaults
   (build command `npm run build`, output directory `dist`).
3. Open **Environment Variables** and add the same two values as in `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Press **Deploy**. After a minute you get a URL like `https://map-app-xxxx.vercel.app`.

From then on, every `git push` to `main` redeploys automatically.

If you add or change the environment variables after deploying, you must
**redeploy** (Deployments → ⋯ → Redeploy) for them to take effect, because they
are baked in at build time.

### Optional: tell Supabase the site address

In Supabase, **Authentication → URL Configuration**, set **Site URL** to your
Vercel address. With email confirmation off nothing depends on it yet, but it
will matter if you later add password-reset emails.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Accounts are not set up yet" | Env variables missing, misspelt, or the dev server / deployment wasn't restarted after adding them. |
| "permission denied for table routes" | `schema.sql` wasn't run, or only partly. Run it again. |
| Saving fails with "row-level security" | Same as above, or you're not logged in. |
| Sign-up says to confirm by email | **Confirm email** is still on (step 2.4). |
| "Email rate limit exceeded" | Same cause: confirmation emails are limited to a few per hour on the free plan. |
| Everything fails after a week or so away | Free Supabase projects pause after about 7 days without activity. Open the dashboard and press **Restore**. Data is kept. |
| Map doesn't jump to your location | Location permission was denied or timed out. It falls back to Oxford; use the **My location** button to retry. Location needs HTTPS, which Vercel and `localhost` both provide. |
| Map area is grey | No network, or the OpenStreetMap tile server is being slow. |

## Costs and limits

- **Supabase free:** 500 MB database (a route is about 1 KB, so room for hundreds
  of thousands), pauses when idle for a week.
- **Vercel Hobby:** free for personal, non-commercial use.
- **Map tiles:** OpenStreetMap's public tile server, free under its
  [usage policy](https://operations.osmfoundation.org/policies/tiles/). Fine for
  a personal app; if this ever gets real traffic, switch to a tile provider with
  a free tier (the URL is one line in `src/components/MapView.tsx`).
