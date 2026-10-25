# Lo-Fi.Study

A focus space in the browser: Pomodoro timer, lo-fi music, ambient sound mixer,
animated backgrounds, tasks, notes, calendar, focus stats with a leaderboard,
and a community chat. Everything works without an account (stored on the
device); signing in syncs it to the server.

**Stack:** Next.js 16 (App Router, standalone output) · React 19 · MongoDB ·
cookie sessions with scrypt password hashes · optional GitHub / Discord /
Google OAuth.

## Run locally

```bash
docker run -d --name lofi-mongo -p 127.0.0.1:27017:27017 mongo:8
cp .env.example .env.local   # set MONGODB_URI=mongodb://127.0.0.1:27017/lofistudy
npm ci
npm run dev
```

Collections and indexes are created on first request. `GET /api/health`
reports database connectivity.

## Deploy

`Dockerfile` builds a small standalone image (`node server.js`, port 3000,
built-in healthcheck). Required at runtime: `MONGODB_URI`. Set
`NEXT_PUBLIC_SITE_URL` as a **build** argument — it drives canonical URLs,
the sitemap, robots.txt and Open Graph tags. See `.env.example` for the
optional OAuth and analytics variables.

## Media

Background loops live in `public/backgrounds/` as 1080p and 720p H.264
(`-1080.mp4`, `-720.mp4`) plus a WebP poster. Phones, touch devices and
data-saver connections get the 720p file; `prefers-reduced-motion` shows the
poster only. Add a background by dropping the three files in and adding one
line to `src/data/backgrounds.ts`.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
